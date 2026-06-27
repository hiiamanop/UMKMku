import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyXenditWebhook } from '@/lib/xendit'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-callback-token') ?? ''
  if (!verifyXenditWebhook(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { external_id, status, payer_email } = body

  // Xendit status: PAID, SETTLED, EXPIRED
  if (status !== 'PAID' && status !== 'SETTLED') {
    // Mark expired/failed jika perlu
    if (status === 'EXPIRED') {
      const service = createServiceClient()
      await service
        .from('subscription_invoices')
        .update({ status: 'expired' })
        .eq('external_id', external_id)
    }
    return NextResponse.json({ ok: true })
  }

  const service = createServiceClient()

  const { data: inv } = await service
    .from('subscription_invoices')
    .select('id, plan_id, email, full_name, status, tenant_id')
    .eq('external_id', external_id)
    .single()

  if (!inv || inv.status === 'paid') {
    return NextResponse.json({ ok: true }) // idempotent
  }

  // Tandai invoice paid
  await service
    .from('subscription_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', inv.id)

  // Jika invoice sudah terhubung ke tenant (renewal), aktifkan subscription langsung
  if (inv.tenant_id) {
    const periodStart = new Date().toISOString()
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await service
      .from('tenant_subscriptions')
      .update({
        plan_id: inv.plan_id,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        ai_tokens_used: 0,
        transactions_used: 0,
        overage_transactions: 0,
        notified_80pct: false,
        suspended_notified: false,
      })
      .eq('tenant_id', inv.tenant_id)

    await service
      .from('tenants')
      .update({ is_active: true })
      .eq('id', inv.tenant_id)
  }

  // Kirim WA aktivasi jika ada nomor (tersimpan di top_up_orders atau bisa dari user profile)
  // ponytail: kirim WA nanti via admin confirm; notif email dari Xendit sudah cukup untuk sekarang

  return NextResponse.json({ ok: true })
}
