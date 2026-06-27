// Kirim WA via Fonnte (https://fonnte.com)
// Set FONNTE_TOKEN di env untuk mengaktifkan. Jika tidak ada, skip.

const FONNTE_URL = 'https://api.fonnte.com/send'

function fmtRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
function cleanPhone(wa: string) { return wa.replace(/\D/g, '').replace(/^0/, '62') }

async function send(phone: string, message: string) {
  const token = process.env.FONNTE_TOKEN
  if (!token || !phone) return
  try {
    await fetch(FONNTE_URL, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: cleanPhone(phone), message }),
    })
  } catch { /* notifikasi gagal tidak boleh gagalkan flow utama */ }
}

// ── Merchant ────────────────────────────────────────────────────────────────

export async function notifyMerchantNewOrder({ merchantWa, brandName, customerName, totalAmount, orderId }: {
  merchantWa: string; brandName: string; customerName: string; totalAmount: number; orderId: string
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  await send(merchantWa, `🛍️ *Pesanan Baru Masuk!* — ${brandName}

Pelanggan: ${customerName || 'Anonim'}
Total: ${fmtRp(totalAmount)}
ID Pesanan: #${shortId}

Segera cek dashboard untuk memverifikasi pembayaran.`)
}

export async function notifyMerchantPaymentSubmitted({ merchantWa, brandName, customerName, totalAmount, orderId }: {
  merchantWa: string; brandName: string; customerName: string; totalAmount: number; orderId: string
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  await send(merchantWa, `📸 *Bukti Pembayaran Diterima!* — ${brandName}

Pelanggan: ${customerName || 'Anonim'}
Total: ${fmtRp(totalAmount)}
ID Pesanan: #${shortId}

Silakan cek dashboard dan verifikasi pembayaran.`)
}

// ── Customer ────────────────────────────────────────────────────────────────

export async function notifyCustomerOrderCreated({ customerWa, brandName, customerName, totalAmount, orderId }: {
  customerWa: string; brandName: string; customerName: string; totalAmount: number; orderId: string
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  await send(customerWa, `Halo ${customerName || 'Kak'}! 👋

Pesananmu di *${brandName}* sudah berhasil dibuat.

ID Pesanan: #${shortId}
Total: ${fmtRp(totalAmount)}

Silakan lakukan pembayaran dan kirimkan bukti transfer di chat pesanan ya! 📸`)
}

export async function notifyCustomerPaymentVerified({ customerWa, brandName, customerName, orderId }: {
  customerWa: string; brandName: string; customerName: string; orderId: string
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  await send(customerWa, `Halo ${customerName || 'Kak'}! ✅

Pembayaran untuk pesanan *#${shortId}* di *${brandName}* sudah berhasil diverifikasi!

Pesananmu sedang kami siapkan untuk pengiriman. Kami akan kabari lagi kalau sudah dikirim ya 📦`)
}

export async function notifyCustomerPaymentRejected({ customerWa, brandName, customerName, orderId, reason }: {
  customerWa: string; brandName: string; customerName: string; orderId: string; reason?: string | null
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  const reasonLine = reason ? `\nCatatan: ${reason}` : ''
  await send(customerWa, `Halo ${customerName || 'Kak'},

Bukti pembayaran pesanan *#${shortId}* di *${brandName}* belum dapat diverifikasi.${reasonLine}

Jika kamu yakin sudah membayar, silakan hubungi merchant langsung ya. 🙏`)
}

export async function notifyCustomerShipped({ customerWa, brandName, customerName, orderId, courierName, trackingNumber }: {
  customerWa: string; brandName: string; customerName: string; orderId: string; courierName: string; trackingNumber: string
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  await send(customerWa, `Halo ${customerName || 'Kak'}! 🚚

Pesanan *#${shortId}* dari *${brandName}* sudah dikirim!

Kurir: ${courierName}
No. Resi: ${trackingNumber}

Pantau pengirimanmu menggunakan nomor resi di atas ya. Terima kasih sudah belanja! 😊`)
}

export async function notifyCustomerCancelled({ customerWa, brandName, customerName, orderId }: {
  customerWa: string; brandName: string; customerName: string; orderId: string
}) {
  const shortId = orderId.slice(-8).toUpperCase()
  await send(customerWa, `Halo ${customerName || 'Kak'},

Pesanan *#${shortId}* di *${brandName}* telah dibatalkan.

Jika ada pertanyaan, silakan hubungi kami. Terima kasih 🙏`)
}

export async function notifyMerchantQuotaWarning({ merchantWa, brandName, remaining, limit }: {
  merchantWa: string; brandName: string; remaining: number; limit: number
}) {
  await send(merchantWa, `⚠️ *Kuota Pesanan Hampir Habis* — ${brandName}

Sisa kuota: *${remaining} dari ${limit} pesanan/bulan*

Segera top-up agar toko tetap berjalan lancar:
👉 Rp 10.000 untuk 50 pesanan tambahan

Buka dashboard untuk top-up sekarang.`)
}
