import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { sendPaymentRejected } from '@/lib/email/resend'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied
  const { invoiceId, reason } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId wajib' }, { status: 400 })
  if (!reason?.trim()) return NextResponse.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 })

  const db = createServiceClient()

  const [{ data: invoice }, { data: settingRows }] = await Promise.all([
    db.from('subscription_invoices').select('email, full_name, plan_id, final_amount').eq('id', invoiceId).single(),
    db.from('platform_settings').select('key, value').in('key', ['support_phone', 'support_email']),
  ])

  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })

  const settings = Object.fromEntries((settingRows ?? []).map(r => [r.key, r.value]))
  const planName = invoice.plan_id.charAt(0).toUpperCase() + invoice.plan_id.slice(1)
  const ref = invoiceId.replace(/-/g, '').slice(-6).toUpperCase()

  await db.from('subscription_invoices').update({ status: 'failed' }).eq('id', invoiceId)

  await Promise.all([
    sendTelegramMessage(`❌ <b>Invoice Ditolak Manual, ${planName}</b>\nNama: ${invoice.full_name}\nEmail: ${invoice.email}\nAlasan: ${reason}`),
    sendPaymentRejected({
      to: invoice.email,
      fullName: invoice.full_name ?? '',
      planName,
      ref,
      reason,
      supportPhone: settings.support_phone,
      supportEmail: settings.support_email,
    }),
  ])

  return NextResponse.json({ ok: true })
}
