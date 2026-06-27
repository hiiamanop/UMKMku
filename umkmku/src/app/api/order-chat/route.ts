import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { geminiChat, geminiVision } from '@/lib/ai/gemini'
import { notifyMerchantPaymentSubmitted } from '@/lib/notifications/whatsapp'

// GET /api/order-chat?orderId=xxx — load messages
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: messages } = await supabase
    .from('order_chats')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  const { data: order } = await supabase
    .from('orders')
    .select('status, total_amount')
    .eq('id', orderId)
    .single()

  return NextResponse.json({ messages: messages ?? [], order })
}

// POST /api/order-chat — send message (text or attachment)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { orderId, content, attachmentUrl } = body

  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  // Verify order belongs to user
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Save user message
  await supabase.from('order_chats').insert({
    order_id: orderId,
    role: 'user',
    content: content || null,
    attachment_url: attachmentUrl || null,
  })

  // Payment proof — always submit to dashboard, AI result determines confidence only
  if (attachmentUrl && order.status === 'pending_payment') {
    const service2 = createServiceClient()
    const { data: tenant2 } = await service2.from('tenants').select('brand_name, whatsapp_number').eq('id', order.tenant_id).single()
    const aiReply = await validatePayment(order, attachmentUrl, tenant2?.brand_name ?? null)

    // Notif WA ke merchant — customer sudah kirim bukti bayar
    if (tenant2?.whatsapp_number) {
      notifyMerchantPaymentSubmitted({
        merchantWa: tenant2.whatsapp_number,
        brandName: tenant2.brand_name,
        customerName: order.customer_name ?? '',
        totalAmount: order.total_amount,
        orderId: order.id,
      })
    }

    // Friendly reply to customer
    await supabase.from('order_chats').insert({ order_id: orderId, role: 'assistant', content: aiReply.message })

    // Audit record: AI assessment (permanent in chat history)
    const confidenceLabel = aiReply.confidence >= 75 ? '✅ Valid' : aiReply.confidence >= 50 ? '⚠️ Perlu Dicek' : '❌ Ditolak'
    const auditMsg = `📋 *Hasil Validasi AI*\nStatus: ${confidenceLabel} (${aiReply.confidence}%)\nCatatan: ${aiReply.note}`
    await supabase.from('order_chats').insert({ order_id: orderId, role: 'assistant', sender_type: 'ai', content: auditMsg })

    const service = createServiceClient()
    await service.from('orders').update({
      status: 'payment_submitted',
      payment_confidence: aiReply.confidence,
      payment_ai_note: aiReply.note,
    }).eq('id', orderId)
    revalidatePath(`/${order.slug}/orders`)
    return NextResponse.json({ reply: aiReply.message, statusUpdated: true })
  }

  // Cancel intent
  const cancelKeywords = ['cancel', 'batal', 'batalkan', 'ingin cancel', 'mau cancel', 'ingin membatalkan', 'tidak jadi']
  const msgLower = (content ?? '').toLowerCase()
  if (cancelKeywords.some(k => msgLower.includes(k)) && !['delivered', 'shipped', 'cancelled'].includes(order.status)) {
    const service = createServiceClient()
    await service.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    const cancelReply = 'Pesananmu telah kami batalkan. Jika ini tidak disengaja atau ada yang bisa kami bantu, jangan ragu untuk menghubungi kami ya. Terima kasih 🙏'
    await supabase.from('order_chats').insert({ order_id: orderId, role: 'assistant', content: cancelReply })
    return NextResponse.json({ reply: cancelReply, orderCancelled: true })
  }

  // General AI response via Ollama — include recent chat history for context
  const { data: recentChats } = await supabase
    .from('order_chats')
    .select('role, content')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(10)

  const history = (recentChats ?? []).reverse()

  // Fetch tenant WA for rejection follow-up context
  const service = createServiceClient()
  const { data: tenant } = await service.from('tenants').select('brand_name, whatsapp_number').eq('id', order.tenant_id).single()

  const aiReply = await getAIReply(order, content ?? '', history, tenant)
  await supabase.from('order_chats').insert({ order_id: orderId, role: 'assistant', content: aiReply })
  return NextResponse.json({ reply: aiReply })
}

async function getAIReply(order: any, userMessage: string, history: any[] = [], tenant?: any): Promise<string> {
  const totalFormatted = 'Rp ' + order.total_amount.toLocaleString('id-ID')
  const items = (order.order_items ?? []).map((i: any) => `- ${i.product_name} x${i.quantity}`).join('\n')

  // Detect if there was a recent payment rejection in history
  const recentAssistantMsgs = history.filter(m => m.role === 'assistant').map(m => m.content ?? '')
  const wasRejected = recentAssistantMsgs.some(m => m.includes('belum dapat diverifikasi') || m.includes('WA_BUTTON'))

  // Strip WA_BUTTON markers from history before sending to AI
  const cleanHistory = history
    .filter(m => m.content)
    .map(m => ({ role: m.role, content: (m.content as string).replace(/\[WA_BUTTON:[^\]]+\]/g, '[tombol WhatsApp]') }))

  const historyText = cleanHistory
    .map(m => `${m.role === 'user' ? 'Customer' : 'Asisten'}: ${m.content}`)
    .join('\n')

  const waInfo = tenant?.whatsapp_number
    ? `WhatsApp merchant: ${tenant.whatsapp_number} (${tenant.brand_name})`
    : ''

  const rejectionContext = wasRejected
    ? `\nPENTING: Sebelumnya bukti pembayaran customer DITOLAK oleh sistem karena tidak valid. Customer sekarang protes bahwa mereka sudah bayar. Karena kamu tidak bisa memverifikasi pembayaran, arahkan customer untuk menghubungi merchant langsung via WhatsApp agar bisa verifikasi manual. ${waInfo}`
    : ''

  const prompt = `Kamu adalah asisten toko skincare yang membantu customer.

Konteks pesanan:
- ID Pesanan: #${order.id?.slice(-8).toUpperCase()}
- Total: ${totalFormatted}
- Item:\n${items}
- Status: ${order.status}${rejectionContext}

Riwayat percakapan terakhir:
${historyText}

Pesan terbaru dari customer: "${userMessage}"

Instruksi:
- Balas dalam Bahasa Indonesia yang ramah dan empati, maksimal 2-3 kalimat
- Jika ada penolakan pembayaran dan customer protes, JANGAN minta kirim bukti lagi — akui situasinya dan minta hubungi merchant via WA untuk verifikasi manual
- Jangan menyebutkan kompetitor atau klaim medis`

  try {
    const ollamaBase = process.env.OLLAMA_BASE_URL?.replace('/v1', '') ?? 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL ?? 'gemma4:12b'
    const res = await fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, think: false, messages: [{ role: 'user', content: prompt }], stream: false }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.message?.content ?? fallbackReply(order.status)
    }
  } catch { /* Ollama tidak tersedia */ }

  // Fallback: Gemini 2.0 Flash
  try {
    return await geminiChat([{ role: 'user', content: prompt }])
  } catch {}
  return fallbackReply(order.status)
}

function fallbackReply(status: string): string {
  if (status === 'pending_payment') return 'Terima kasih atas pesanmu! Silakan lakukan pembayaran dan kirimkan bukti transfer di chat ini ya. 😊'
  if (status === 'payment_submitted') return 'Bukti pembayaranmu sudah kami terima dan sedang dalam proses verifikasi. Kami akan segera mengkonfirmasi pesananmu!'
  if (status === 'payment_verified') return 'Pembayaranmu sudah terverifikasi dan pesanan sedang kami siapkan. Terima kasih atas kepercayaanmu! 🎉'
  if (status === 'shipped') return 'Pesananmu sudah dalam perjalanan! Pantau nomor resi yang sudah kami kirimkan ya.'
  return 'Terima kasih telah menghubungi kami! Ada yang bisa kami bantu?'
}

async function validatePayment(order: any, imageUrl: string, brandName: string | null) {
  const amount = order.total_amount as number
  // All common Indonesian rupiah formats the image might show
  const amountFormats = [
    amount.toLocaleString('id-ID'),                          // 360.000
    amount.toLocaleString('en-US').replace(',', '.'),        // 360.000 alt
    `Rp ${amount.toLocaleString('id-ID')}`,                  // Rp 360.000
    `Rp${amount.toLocaleString('id-ID')}`,                   // Rp360.000
    String(amount),                                          // 360000
  ].join(' ATAU ')

  const customerName = order.customer_name ?? 'tidak diketahui'
  const merchantName = brandName ?? 'nama toko'

  // Fetch image once — dipakai oleh Ollama maupun Gemini fallback
  let imageBase64: string | null = null
  try {
    const imgRes = await fetch(imageUrl)
    if (imgRes.ok) {
      const buf = await imgRes.arrayBuffer()
      imageBase64 = Buffer.from(buf).toString('base64')
    }
  } catch { /* proceed without image */ }

  const validationPrompt = `Kamu adalah auditor keuangan KETAT. Periksa gambar bukti pembayaran ini piksel demi piksel.

DATA PESANAN YANG HARUS DICOCOKKAN:
- Nominal pesanan: ${amount} rupiah (format di gambar bisa: ${amountFormats})
- Nama pemesan (pengirim): "${customerName}"
- Nama merchant/toko (penerima): "${merchantName}"

LANGKAH PEMERIKSAAN:
1. Baca nominal yang tertulis di gambar. Catat angkanya persis.
2. Bandingkan dengan nominal pesanan ${amount}. Harus IDENTIK (beda 1 rupiah pun = GAGAL).
3. Cari nama penerima/merchant di gambar. Harus mengandung kata dari "${merchantName}".
4. Cari nama pengirim di gambar. Harus mirip dengan "${customerName}".
5. Periksa status transaksi: harus "Berhasil", "Success", "Sukses", atau padanan resminya.

PENTING:
- Jika gambar bukan screenshot pembayaran → semua false
- Jika nominal di gambar berbeda dari ${amount} → amount_matches: false
- Jika nama penerima tidak mengandung kata dari "${merchantName}" → merchant_name_matches: false
- Jangan menebak. Jika tulisan tidak terbaca jelas → nilai false

Balas HANYA JSON ini, tanpa teks lain sebelum atau sesudah:
{
  "amount_read": "<nominal yang kamu baca dari gambar, tulis angkanya>",
  "recipient_read": "<nama penerima yang kamu baca dari gambar>",
  "sender_read": "<nama pengirim yang kamu baca dari gambar>",
  "checks": {
    "is_payment_screenshot": <true/false>,
    "amount_matches": <true/false>,
    "merchant_name_matches": <true/false>,
    "sender_name_matches": <true/false>,
    "status_success": <true/false>
  },
  "note": "<ringkasan temuan, max 15 kata, sebutkan nominal yang terbaca jika berbeda>",
  "message": "<pesan untuk customer, 1-2 kalimat, Bahasa Indonesia>"
}`

  // Coba Ollama
  try {
    const ollamaBase = process.env.OLLAMA_BASE_URL?.replace('/v1', '') ?? 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL ?? 'gemma4:12b'
    const messagePayload: any = { role: 'user', content: validationPrompt }
    if (imageBase64) messagePayload.images = [imageBase64]

    const res = await fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, think: false, messages: [messagePayload], stream: false }),
    })

    if (res.ok) {
      const data = await res.json()
      const raw = data.message?.content ?? ''
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        const c = parsed.checks ?? {}
        const isPayment    = c.is_payment_screenshot === true
        const amountOk     = c.amount_matches === true
        const merchantOk   = c.merchant_name_matches === true
        const senderOk     = c.sender_name_matches === true
        const statusOk     = c.status_success === true
        const confidence = (amountOk ? 45 : 0) + (merchantOk ? 25 : 0) + (isPayment ? 15 : 0) + (statusOk ? 10 : 0) + (senderOk ? 5 : 0)
        const valid = isPayment && amountOk && merchantOk && statusOk && confidence >= 80
        const amountRead = parsed.amount_read ? `Terbaca: ${parsed.amount_read}` : null
        const note = parsed.note ?? (amountRead ?? buildNote(c))
        return { valid, confidence, note, message: parsed.message ?? fallbackMessage(amount) }
      }
      return { valid: false, confidence: 0, note: 'Respons AI tidak dapat diparsing', message: 'Maaf, gagal memvalidasi bukti. Silakan kirim ulang foto yang lebih jelas.' }
    }
  } catch { /* Ollama tidak tersedia */ }

  // Fallback: Gemini 2.5 Flash + thinking (vision)
  if (imageBase64) {
    try {
      const raw = await geminiVision(validationPrompt, imageBase64)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        const c = parsed.checks ?? {}
        const isPayment = c.is_payment_screenshot === true
        const amountOk = c.amount_matches === true
        const merchantOk = c.merchant_name_matches === true
        const senderOk = c.sender_name_matches === true
        const statusOk = c.status_success === true
        const confidence = (amountOk ? 45 : 0) + (merchantOk ? 25 : 0) + (isPayment ? 15 : 0) + (statusOk ? 10 : 0) + (senderOk ? 5 : 0)
        const valid = isPayment && amountOk && merchantOk && statusOk && confidence >= 80
        const note = parsed.note ?? buildNote(c)
        return { valid, confidence, note, message: parsed.message ?? fallbackMessage(amount) }
      }
    } catch { /* Gemini juga gagal */ }
  }

  return {
    valid: false,
    confidence: 0,
    note: 'AI tidak tersedia, validasi manual diperlukan',
    message: `Bukti pembayaranmu sudah kami terima. Tim kami akan memverifikasi secara manual. 🙏`,
  }
}

function buildNote(checks: Record<string, boolean>): string {
  if (!checks.is_payment_screenshot) return 'Bukan screenshot pembayaran'
  if (!checks.amount_matches) return 'Nominal tidak sesuai pesanan'
  if (!checks.merchant_name_matches) return 'Nama merchant/penerima tidak cocok'
  if (!checks.status_success) return 'Status transaksi bukan Berhasil'
  if (!checks.sender_name_matches) return 'Nama pengirim tidak cocok'
  return 'Semua kriteria terpenuhi'
}

function fallbackMessage(amount: number) {
  return `Terima kasih telah mengirimkan bukti pembayaran untuk pesanan senilai Rp ${amount.toLocaleString('id-ID')}! Kami akan segera memverifikasi. 😊`
}
