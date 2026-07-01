import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSubscriptionActivated } from '@/lib/email/resend'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

const PLAN_NAMES: Record<string, string> = { business: 'Business', enterprise: 'Enterprise' }

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied
  const { invoiceId, tenantId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId wajib' }, { status: 400 })

  const db = createServiceClient()

  const { data: invoice, error: invoiceErr } = await db
    .from('subscription_invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (invoiceErr) {
    console.error('[activate] fetch invoice error:', invoiceErr)
    return NextResponse.json({ error: 'Gagal fetch invoice' }, { status: 500 })
  }
  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
  if (!['paid', 'failed'].includes(invoice.status)) return NextResponse.json({ error: 'Invoice tidak dapat diaktifkan' }, { status: 400 })

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  const periodEndStr = periodEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  // Update status invoice ke paid jika sebelumnya failed
  const { error: updateInvoiceErr } = await db
    .from('subscription_invoices')
    .update({ status: 'paid', paid_at: invoice.paid_at ?? now.toISOString(), onboarding_completed_at: now.toISOString() })
    .eq('id', invoiceId)

  if (updateInvoiceErr) console.error('[activate] update invoice error:', updateInvoiceErr)

  // Upsert tenant_subscriptions jika ada tenant terhubung
  const resolvedTenantId = tenantId ?? invoice.tenant_id ?? null

  if (resolvedTenantId) {
    const { data: existing, error: subFetchErr } = await db
      .from('tenant_subscriptions')
      .select('id')
      .eq('tenant_id', resolvedTenantId)
      .maybeSingle()

    if (subFetchErr) console.error('[activate] fetch tenant_subscriptions error:', subFetchErr)

    const subPayload = {
      plan_id: invoice.plan_id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }

    if (existing) {
      const { error: subUpdateErr } = await db
        .from('tenant_subscriptions')
        .update({ ...subPayload, ai_tokens_used: 0, transactions_used: 0, overage_transactions: 0, notified_80pct: false })
        .eq('tenant_id', resolvedTenantId)
      if (subUpdateErr) console.error('[activate] update tenant_subscriptions error:', subUpdateErr)
    } else {
      const { error: subInsertErr } = await db
        .from('tenant_subscriptions')
        .insert({ tenant_id: resolvedTenantId, ...subPayload })
      if (subInsertErr) console.error('[activate] insert tenant_subscriptions error:', subInsertErr)
    }
  } else {
    console.log('[activate] no tenant linked to invoice yet, skipping subscription upsert')
  }

  const planName = PLAN_NAMES[invoice.plan_id] ?? invoice.plan_id
  console.log('[activate] sending email to:', invoice.email, 'plan:', planName, 'RESEND_API_KEY set:', !!process.env.RESEND_API_KEY)

  const [emailResult, telegramResult] = await Promise.allSettled([
    sendSubscriptionActivated({
      to: invoice.email,
      fullName: invoice.full_name ?? '',
      planName,
      amount: invoice.final_amount,
      periodEnd: periodEndStr,
      invoiceId,
    }),
    sendTelegramMessage(
      `🚀 <b>Subscription Diaktifkan, ${planName}</b>\n` +
      `Nama: ${invoice.full_name}\nEmail: ${invoice.email}`
    ),
  ])

  if (emailResult.status === 'rejected') console.error('[activate] email error:', emailResult.reason)
  if (telegramResult.status === 'rejected') console.error('[activate] telegram error:', telegramResult.reason)

  return NextResponse.json({ ok: true })
}
