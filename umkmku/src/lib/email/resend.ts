import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 'placeholder')

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px">
          <span style="font-size:22px;font-weight:800;color:#0A2F73;letter-spacing:-0.5px">
            UMKM<span style="color:#F4B400">u</span>
          </span>
        </td></tr>

        <!-- Content -->
        ${content}

        <!-- Footer -->
        <tr><td style="padding-top:32px;text-align:center">
          <p style="margin:0;font-size:13px;color:#9ca3af">
            Ada pertanyaan? Hubungi kami di
            <a href="mailto:halo@umkmu.site" style="color:#0A2F73;text-decoration:none">halo@umkmu.site</a>
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">© 2026 UMKMu.site</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function card(content: string) {
  return `<tr><td style="background:#ffffff;border-radius:16px;padding:32px;margin-bottom:16px;border:1px solid #e5e7eb">
    ${content}
  </td></tr>`
}

function row(label: string, value: string, bold = false, borderTop = false) {
  const border = borderTop ? 'border-top:1px solid #e5e7eb;' : ''
  const weight = bold ? 'font-weight:700;' : ''
  return `<tr>
    <td style="padding:10px 0;${border}font-size:14px;color:#6b7280;${weight}">${label}</td>
    <td style="padding:10px 0;${border}font-size:14px;color:#111827;${weight};text-align:right">${value}</td>
  </tr>`
}

export async function sendPaymentReceived({
  to, fullName, planName, amount, ppn, invoiceId,
}: {
  to: string
  fullName: string
  planName: string
  amount: number
  ppn?: number
  invoiceId: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const subtotal = ppn ? amount - ppn : amount

  const result = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Pembayaran diterima, UMKMu ${planName}`,
    html: layout(`
      <!-- Heading -->
      <tr><td style="padding-bottom:24px">
        <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.5px">
          Pembayaran diterima
        </h1>
        <p style="margin:0;font-size:14px;color:#6b7280">
          Invoice #${invoiceId.slice(0, 8).toUpperCase()} &nbsp;|&nbsp; ${date}
        </p>
      </td></tr>

      <!-- Intro -->
      <tr><td style="padding-bottom:20px">
        <p style="margin:0;font-size:15px;color:#374151">
          Halo <strong>${fullName}</strong>, kami sudah menerima bukti pembayaran kamu untuk plan
          <strong>UMKMu ${planName}</strong>. Plan akan segera diaktifkan.
        </p>
      </td></tr>

      <!-- Invoice card -->
      ${card(`
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827">Ringkasan Invoice</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:12px 0;font-size:14px;color:#374151">UMKMu ${planName}</td>
            <td style="padding:12px 0;font-size:14px;color:#374151;text-align:right">Langganan 1 bulan</td>
          </tr>
          ${ppn ? row('Subtotal', fmt(subtotal)) : ''}
          ${ppn ? row('PPN (12%)', fmt(ppn)) : ''}
          ${row('Total yang dibayar', fmt(amount), true, true)}
          <tr><td colspan="2" style="padding-top:16px;border-top:1px solid #f3f4f6">
            <span style="font-size:13px;color:#6b7280">Metode pembayaran: </span>
            <span style="font-size:13px;color:#111827;font-weight:600">QRIS Manual</span>
          </td></tr>
        </table>
      `)}

      <!-- Next step -->
      <tr><td style="padding-top:8px">
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6">
          Tim kami sedang memverifikasi pembayaran dan akan mengaktifkan plan kamu.
          Kamu akan mendapat email konfirmasi aktivasi segera setelah selesai.
        </p>
      </td></tr>
    `),
  })
  console.log('[Resend] sendPaymentReceived:', JSON.stringify(result))
}

export async function sendPaymentRejected({
  to, fullName, planName, ref, reason, supportPhone, supportEmail,
}: {
  to: string
  fullName: string
  planName: string
  ref: string
  reason: string
  supportPhone?: string | null
  supportEmail?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return

  const contactRows = [
    supportPhone ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280">WhatsApp</td><td style="padding:8px 0;font-size:14px;text-align:right"><a href="https://wa.me/${supportPhone}" style="color:#0A2F73;text-decoration:none;font-weight:600">wa.me/${supportPhone}</a></td></tr>` : '',
    supportEmail ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280">Email</td><td style="padding:8px 0;font-size:14px;text-align:right"><a href="mailto:${supportEmail}" style="color:#0A2F73;text-decoration:none;font-weight:600">${supportEmail}</a></td></tr>` : '',
  ].join('')

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Bukti pembayaran perlu dikonfirmasi manual, UMKMu`,
    html: layout(`
      <tr><td style="padding-bottom:24px">
        <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.5px">
          Verifikasi otomatis gagal
        </h1>
      </td></tr>

      <tr><td style="padding-bottom:20px">
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
          Halo <strong>${fullName}</strong>, sistem kami tidak dapat memverifikasi bukti pembayaran untuk plan
          <strong>UMKMu ${planName}</strong> secara otomatis.
        </p>
        <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6">
          Alasan: ${reason}
        </p>
      </td></tr>

      ${card(`
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827">Langkah selanjutnya</p>
        <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6">
          Kirimkan bukti pembayaran langsung ke tim kami beserta kode referensi di bawah:
        </p>
        <div style="background:#F8FAFC;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;border:1px solid #E5EAF0">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280">Kode Referensi</p>
          <p style="margin:0;font-size:28px;font-weight:800;color:#0A2F73;letter-spacing:4px;font-family:monospace">${ref}</p>
        </div>
        ${contactRows ? `<table width="100%" cellpadding="0" cellspacing="0">${contactRows}</table>` : ''}
      `)}

      <tr><td style="padding-top:8px">
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
          Pembayaran yang valid akan segera kami proses setelah konfirmasi manual.
        </p>
      </td></tr>
    `),
  })
}

export async function sendSubscriptionActivated({
  to, fullName, planName, amount, periodEnd, invoiceId,
}: {
  to: string
  fullName: string
  planName: string
  amount: number
  periodEnd: string
  invoiceId?: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const result = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Plan ${planName} kamu sudah aktif, UMKMu`,
    html: layout(`
      <!-- Heading -->
      <tr><td style="padding-bottom:24px">
        <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.5px">
          Plan kamu sudah aktif! 🎉
        </h1>
        <p style="margin:0;font-size:14px;color:#6b7280">
          ${invoiceId ? `Invoice #${invoiceId.slice(0, 8).toUpperCase()} &nbsp;|&nbsp; ` : ''}${date}
        </p>
      </td></tr>

      <!-- Intro -->
      <tr><td style="padding-bottom:20px">
        <p style="margin:0;font-size:15px;color:#374151">
          Selamat <strong>${fullName}</strong>! Plan <strong>UMKMu ${planName}</strong> kamu
          sudah aktif dan siap digunakan.
        </p>
      </td></tr>

      <!-- Detail card -->
      ${card(`
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827">Detail Subscription</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Plan', `UMKMu ${planName}`)}
          ${row('Total dibayar', fmt(amount))}
          ${row('Periode aktif', periodEnd, false, true)}
        </table>
      `)}

      <!-- CTA -->
      <tr><td style="padding-top:8px;padding-bottom:8px">
        <a href="https://umkmu.site/onboarding${invoiceId ? `?invoice=${invoiceId}` : ''}"
          style="display:inline-block;background:#F4B400;color:#1a1a1a;font-weight:700;font-size:15px;
                 padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px">
          Mulai Setup Toko →
        </a>
      </td></tr>

      <tr><td style="padding-top:16px">
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
          Toko kamu sudah bisa diakses. Jika ada kendala, balas email ini dan kami akan segera membantu.
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;line-height:1.6">
          Jika kamu menunggu email lain dari kami dan tidak menemukannya, cek folder <strong style="color:#9ca3af">Spam</strong> atau <strong style="color:#9ca3af">Promosi</strong>.
        </p>
      </td></tr>
    `),
  })
  console.log('[Resend] sendSubscriptionActivated:', JSON.stringify(result))
}
