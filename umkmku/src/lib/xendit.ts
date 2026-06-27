const XENDIT_BASE = 'https://api.xendit.co'

function xenditAuth() {
  const key = process.env.XENDIT_API_KEY
  if (!key) throw new Error('XENDIT_API_KEY not set')
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64')
}

export interface XenditInvoiceParams {
  externalId: string
  amount: number
  payerEmail: string
  description: string
  successRedirectUrl: string
  failureRedirectUrl: string
  items: { name: string; quantity: number; price: number; category: string }[]
}

export interface XenditInvoice {
  id: string
  invoice_url: string
  external_id: string
  status: string
}

export async function createXenditInvoice(params: XenditInvoiceParams): Promise<XenditInvoice> {
  const res = await fetch(`${XENDIT_BASE}/v2/invoices`, {
    method: 'POST',
    headers: {
      Authorization: xenditAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
      items: params.items,
      currency: 'IDR',
      // Aktifkan berbagai metode pembayaran
      payment_methods: ['CREDIT_CARD', 'BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'OVO', 'DANA', 'SHOPEEPAY', 'QRIS'],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Xendit error ${res.status}: ${err.message ?? 'Unknown'}`)
  }

  return res.json()
}

// Verifikasi webhook dari Xendit via callback token
export function verifyXenditWebhook(token: string): boolean {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN
  if (!expected) return false
  return token === expected
}
