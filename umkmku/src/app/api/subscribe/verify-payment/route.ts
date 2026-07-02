import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { deepseekVision } from '@/lib/ai/deepseek'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { sendPaymentReceived, sendPaymentRejected } from '@/lib/email/resend'

// Kode referensi unik dari invoice ID (6 karakter terakhir)
function refCode(invoiceId: string) {
  return invoiceId.replace(/-/g, '').slice(-6).toUpperCase()
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildPrompt(amount: number, refCode: string, merchantName: string | null, invoiceCreatedAt: Date) {
  const merchantCheck = merchantName
    ? `4. Apakah nama penerima mengandung "${merchantName.slice(0, 25)}"?\n   (Aplikasi sering memotong nama merchant menjadi 25 karakter pertama, cocokkan hanya bagian itu)`
    : ''

  const fmtTime = (d: Date) => d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })
  const invoiceDate  = invoiceCreatedAt.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
  const invoiceStart = fmtTime(invoiceCreatedAt)
  const invoiceEnd   = fmtTime(new Date(invoiceCreatedAt.getTime() + 30 * 60 * 1000))

  return `Ini adalah bukti pembayaran QRIS. Verifikasi hal berikut:

WAJIB (semua harus terpenuhi):
1. Apakah ini screenshot/foto pembayaran QRIS yang ASLI? Ciri editan: font tidak konsisten, pikselasi aneh di area nominal, angka terlihat ditempel, background tidak natural.
2. Apakah nominal yang tertera adalah Rp ${amount.toLocaleString('id-ID')} (toleransi ±1000)?
3. Apakah status transaksi BERHASIL/SUKSES?
${merchantCheck}
4. BACA TANGGAL & JAM DARI STRUK lalu bandingkan dengan nilai berikut:
   - Tanggal referensi: ${invoiceDate}
   - Jam mulai: ${invoiceStart} WIB
   - Jam batas: ${invoiceEnd} WIB
   ATURAN PERBANDINGAN (lakukan secara literal, jangan gunakan pengetahuan internal tentang tanggal):
   - Baca tanggal dari struk → apakah sama dengan "${invoiceDate}"? Jika berbeda → valid = false.
   - Baca jam dari struk → konversi ke 24 jam (10:09 AM = 10:09, 2:30 PM = 14:30) → apakah berada di antara ${invoiceStart} dan ${invoiceEnd}? Jika di luar rentang → valid = false.
   - Jika tanggal/jam tidak terbaca → abaikan poin ini, jangan tolak karena alasan ini.

PENGUAT (opsional, tingkatkan keyakinan jika ada):
- Apakah kode referensi "${refCode}" tertera di kolom catatan/berita transfer?
  (Beberapa e-wallet tidak memiliki kolom ini, jadi tidak ada bukan berarti tidak valid)

Jika semua poin WAJIB terpenuhi → valid = true, meski kode referensi tidak ada.
Jika ada poin WAJIB yang tidak terpenuhi → valid = false.

Jawab hanya JSON: {"valid": true/false, "ref_found": true/false, "transaction_time": "waktu yang kamu baca dari struk, atau null jika tidak terbaca", "reason": "alasan singkat dalam bahasa Indonesia"}`
}

async function checkWithOllama(base64: string, amount: number, ref: string, merchantName: string | null, invoiceCreatedAt: Date) {
  const ollamaUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1').replace('/v1', '')
  const model = process.env.OLLAMA_MODEL ?? 'gemma4:12b'
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, stream: false, think: false,
      messages: [{ role: 'user', content: buildPrompt(amount, ref, merchantName, invoiceCreatedAt), images: [base64] }],
    }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  const data = await res.json()
  const match = (data.message?.content ?? '').match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0]) as { valid: boolean; reason: string; transaction_time?: string }
}

async function checkWithGemini(base64: string, mimeType: string, amount: number, ref: string, merchantName: string | null, invoiceCreatedAt: Date) {
  const result = await deepseekVision(buildPrompt(amount, ref, merchantName, invoiceCreatedAt), base64, mimeType as 'image/jpeg' | 'image/png' | 'image/webp')
  const match = result.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0]) as { valid: boolean; reason: string; transaction_time?: string }
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const invoiceId = form.get('invoiceId') as string
  const amount = Number(form.get('amount'))

  if (!file || !invoiceId) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File terlalu besar (max 10MB)' }, { status: 413 })
  }

  const db = createServiceClient()

  const { data: invoice } = await db
    .from('subscription_invoices')
    .select('id, plan_id, full_name, email, phone, final_amount, ppn, status, created_at')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
  if (invoice.status === 'paid') return NextResponse.json({ verified: true, message: 'Sudah terverifikasi' })

  const invoiceCreatedAt = new Date(invoice.created_at)
  const deadline = new Date(invoiceCreatedAt.getTime() + 30 * 60 * 1000)
  const now = new Date()
  console.log('[verify-payment] invoice created:', invoiceCreatedAt.toISOString(), 'deadline:', deadline.toISOString(), 'now:', now.toISOString(), 'expired:', now > deadline)
  if (now > deadline) {
    return NextResponse.json({ verified: false, expired: true, message: 'Batas waktu upload bukti bayar (30 menit) telah habis. Silakan buat invoice baru.' }, { status: 400 })
  }

  // Ambil settings yang diperlukan sekaligus
  const { data: settingRows } = await db.from('platform_settings').select('key, value').in('key', ['qris_merchant_name', 'support_phone', 'support_email'])
  const settings = Object.fromEntries((settingRows ?? []).map(r => [r.key, r.value]))
  const merchantName = settings.qris_merchant_name ?? null
  const supportPhone = settings.support_phone ?? null
  const supportEmail = settings.support_email ?? null

  const ref = refCode(invoiceId)
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `subscription-proofs/${invoiceId}.${ext}`

  const { error: uploadErr } = await db.storage
    .from('payment-proofs')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

  const proofUrl = uploadErr ? null : db.storage.from('payment-proofs').getPublicUrl(path).data.publicUrl

  let verified = false
  let reason = 'Gagal memverifikasi'
  let transactionTime: string | null = null
  const useOllama = !!process.env.OLLAMA_BASE_URL

  try {
    const parsed = useOllama
      ? await checkWithOllama(base64, amount, ref, merchantName, invoiceCreatedAt)
      : await checkWithGemini(base64, file.type, amount, ref, merchantName, invoiceCreatedAt)
    verified = parsed.valid === true
    reason = parsed.reason ?? reason
    transactionTime = parsed.transaction_time ?? null
  } catch (err) {
    console.error('[verify-payment] primary vision error:', err)
    if (useOllama && process.env.GEMINI_API_KEY) {
      try {
        const parsed = await checkWithGemini(base64, file.type, amount, ref, merchantName, invoiceCreatedAt)
        verified = parsed.valid === true
        reason = parsed.reason ?? reason
        transactionTime = parsed.transaction_time ?? null
      } catch (err2) {
        console.error('[verify-payment] Gemini fallback error:', err2)
      }
    }
  }

  const planName = invoice.plan_id.charAt(0).toUpperCase() + invoice.plan_id.slice(1)

  if (verified) {
    await db.from('subscription_invoices').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_proof_url: proofUrl,
    }).eq('id', invoiceId)

    Promise.all([
      sendTelegramMessage(
        `✅ <b>Pembayaran Terverifikasi AI, UMKMu ${invoice.plan_id}</b>\n` +
        `Nama: ${invoice.full_name}\nEmail: ${invoice.email}\n` +
        `Nominal: Rp ${invoice.final_amount.toLocaleString('id-ID')}\nRef: ${ref}\n` +
        `🤖 AI: ${reason}\n\n` +
        `⚡ Validasi manual di /admin/invoices`
      ),
      sendPaymentReceived({
        to: invoice.email,
        fullName: invoice.full_name ?? '',
        planName,
        amount: invoice.final_amount,
        ppn: invoice.ppn,
        invoiceId,
      }),
    ]).catch(() => {})

    return NextResponse.json({ verified: true })
  }

  // Tolak: hapus dari storage, jangan simpan bukti yang gagal
  await db.storage.from('payment-proofs').remove([path])

  Promise.all([
    sendTelegramMessage(
      `⚠️ <b>Bukti Bayar Ditolak AI, Perlu Review</b>\n` +
      `Nama: ${invoice.full_name}\nEmail: ${invoice.email}\n` +
      `Alasan: ${reason}\nRef: ${ref}\nInvoice: ${invoiceId}`
    ),
    sendPaymentRejected({
      to: invoice.email,
      fullName: invoice.full_name ?? '',
      planName,
      ref,
      reason,
      supportPhone,
      supportEmail,
    }),
  ]).catch(() => {})

  const contactHtml = [
    supportPhone ? `WhatsApp: <a href="https://wa.me/${escapeHtml(supportPhone)}" style="color:#0A2F73">wa.me/${escapeHtml(supportPhone)}</a>` : null,
    supportEmail ? `Email: <a href="mailto:${escapeHtml(supportEmail)}" style="color:#0A2F73">${escapeHtml(supportEmail)}</a>` : null,
  ].filter(Boolean).join(' &nbsp;|&nbsp; ')

  const fmtTimeLocal = (d: Date) => d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })
  const invoiceStart = fmtTimeLocal(invoiceCreatedAt)
  const invoiceEnd   = fmtTimeLocal(new Date(invoiceCreatedAt.getTime() + 30 * 60 * 1000))

  const debugInfo = [
    `Invoice dibuat: ${invoiceStart} WIB`,
    `Batas bayar: ${invoiceEnd} WIB`,
    transactionTime ? `AI baca waktu struk: ${escapeHtml(transactionTime)}` : `AI tidak bisa baca waktu di struk`,
  ].join(' · ')

  const message = `Bukti pembayaran tidak dapat diverifikasi otomatis: <em>${escapeHtml(reason)}</em>.<br>` +
    `<small style="color:#888">${debugInfo}</small><br><br>` +
    `Silakan kirimkan bukti bayar beserta kode referensi <strong>${escapeHtml(ref)}</strong> langsung kepada tim kami` +
    (contactHtml ? `:<br>${contactHtml}` : '.')

  return NextResponse.json({ verified: false, message })
}
