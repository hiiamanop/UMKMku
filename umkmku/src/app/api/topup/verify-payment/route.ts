import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deepseekVision } from '@/lib/ai/deepseek'

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildPrompt(amount: number, invoiceCreatedAt: Date) {
  const fmtTime = (d: Date) => d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })
  const invoiceDate = invoiceCreatedAt.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' })
  const invoiceStart = fmtTime(invoiceCreatedAt)
  const invoiceEnd = fmtTime(new Date(invoiceCreatedAt.getTime() + 30 * 60 * 1000))

  return `Ini adalah bukti pembayaran QRIS. Verifikasi hal berikut:

WAJIB (semua harus terpenuhi):
1. Apakah ini screenshot/foto pembayaran QRIS yang ASLI?
2. Apakah nominal yang tertera adalah Rp ${amount.toLocaleString('id-ID')} (toleransi ±1000)?
3. Apakah status transaksi BERHASIL/SUKSES?
4. BACA TANGGAL & JAM DARI STRUK lalu bandingkan:
   - Tanggal referensi: ${invoiceDate}
   - Jam mulai: ${invoiceStart} WIB, Jam batas: ${invoiceEnd} WIB
   ATURAN: Bandingkan secara literal, JANGAN gunakan pengetahuan internal tentang tahun.
   - Baca tanggal dari struk → cocokkan dengan "${invoiceDate}". Berbeda → valid = false.
   - Baca jam → konversi ke 24 jam → bandingkan dengan ${invoiceStart}–${invoiceEnd}. Di luar → valid = false.
   - Tidak terbaca → abaikan, jangan tolak.

Jawab hanya JSON: {"valid": true/false, "transaction_time": "waktu yang kamu baca atau null", "reason": "alasan singkat bahasa Indonesia"}`
}

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1').replace('/v1', '')
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:12b'

async function verifyWithOllama(base64: string, amount: number, createdAt: Date) {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL, stream: false, think: false,
      messages: [{ role: 'user', content: buildPrompt(amount, createdAt), images: [base64] }],
    }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  const match = (data.message?.content ?? '').match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0]) as { valid: boolean; reason: string; transaction_time?: string }
}

async function verifyWithGemini(base64: string, mimeType: string, amount: number, createdAt: Date) {
  const result = await deepseekVision(buildPrompt(amount, createdAt), base64, mimeType as 'image/jpeg' | 'image/png')
  const match = result.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON')
  return JSON.parse(match[0]) as { valid: boolean; reason: string; transaction_time?: string }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const orderId = form.get('orderId') as string
  const amount = Number(form.get('amount'))

  if (!file || !orderId) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const db = createServiceClient()

  const { data: order } = await db.from('top_up_orders')
    .select('*, top_up_packages(price, transaction_quota), tenants(owner_id, brand_name, whatsapp_number)')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
  if ((order.tenants as { owner_id: string }).owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (order.status === 'paid') return NextResponse.json({ verified: true, message: 'Sudah diverifikasi sebelumnya' })

  const createdAt = new Date(order.created_at)
  const deadline = new Date(createdAt.getTime() + 30 * 60 * 1000)
  if (new Date() > deadline) {
    return NextResponse.json({ verified: false, message: 'Batas waktu upload (30 menit) telah habis. Buat order baru.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `topup-proofs/${orderId}.${ext}`

  const { error: uploadErr } = await db.storage.from('payment-proofs').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })
  const proofUrl = uploadErr ? null : db.storage.from('payment-proofs').getPublicUrl(path).data.publicUrl

  let verified = false
  let reason = 'Gagal memverifikasi'
  const useOllama = !!process.env.OLLAMA_BASE_URL

  try {
    const parsed = useOllama
      ? await verifyWithOllama(base64, amount, createdAt)
      : await verifyWithGemini(base64, file.type, amount, createdAt)
    verified = parsed.valid === true
    reason = parsed.reason ?? reason
  } catch {
    if (useOllama && process.env.GEMINI_API_KEY) {
      try {
        const parsed = await verifyWithGemini(base64, file.type, amount, createdAt)
        verified = parsed.valid === true
        reason = parsed.reason ?? reason
      } catch { /* keep default reason */ }
    }
  }

  if (verified) {
    const pkg = order.top_up_packages as { price: number; transaction_quota: number }
    const totalQuota = pkg.transaction_quota * (order.quantity ?? 1)

    await db.from('top_up_orders').update({ status: 'paid', paid_at: new Date().toISOString(), payment_proof_url: proofUrl }).eq('id', orderId)

    const { data: sub } = await db.from('tenant_subscriptions').select('transactions_addon').eq('tenant_id', order.tenant_id).single()
    await db.from('tenant_subscriptions').update({ transactions_addon: (sub?.transactions_addon ?? 0) + totalQuota }).eq('tenant_id', order.tenant_id)

    return NextResponse.json({ verified: true })
  }

  // Tolak: hapus dari storage, jangan simpan bukti yang gagal
  await db.storage.from('payment-proofs').remove([path])

  const { data: settings } = await db.from('platform_settings').select('key, value').in('key', ['support_phone', 'support_email'])
  const s = Object.fromEntries((settings ?? []).map(r => [r.key, r.value]))

  const contactHtml = [
    s.support_phone ? `WhatsApp: <a href="https://wa.me/${escapeHtml(s.support_phone)}" style="color:#0A2F73">wa.me/${escapeHtml(s.support_phone)}</a>` : null,
    s.support_email ? `Email: <a href="mailto:${escapeHtml(s.support_email)}" style="color:#0A2F73">${escapeHtml(s.support_email)}</a>` : null,
  ].filter(Boolean).join(' &nbsp;|&nbsp; ')

  const message = `Bukti pembayaran tidak dapat diverifikasi: <em>${escapeHtml(reason)}</em>.<br>` +
    (contactHtml ? `Hubungi tim kami: ${contactHtml}` : '')

  return NextResponse.json({ verified: false, message })
}
