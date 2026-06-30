import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const COMMISSION_RATE = 0.2 // 20% of monthly plan price per tenant

// Plan prices in rupiah
const PLAN_PRICES: Record<string, number> = {
  business: 399000,
  enterprise: 599000,
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const period = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  // Get all template_usage with active paid tenants
  const { data: usages } = await supabase
    .from('template_usage')
    .select(`
      template_id,
      tenant_id,
      templates!inner (id, freelancer_id),
      tenants!inner (subscription_id)
    `)

  if (!usages?.length) return NextResponse.json({ ok: true, processed: 0 })

  // Group by template → freelancer
  const byFreelancer: Record<string, { freelancerId: string; templateId: string; tenantIds: string[] }> = {}

  for (const usage of usages) {
    const tmpl = usage.templates as unknown as { id: string; freelancer_id: string | null }
    if (!tmpl.freelancer_id) continue

    const key = `${tmpl.freelancer_id}:${usage.template_id}`
    if (!byFreelancer[key]) {
      byFreelancer[key] = { freelancerId: tmpl.freelancer_id, templateId: usage.template_id, tenantIds: [] }
    }
    byFreelancer[key].tenantIds.push(usage.tenant_id)
  }

  let processed = 0
  for (const { freelancerId, templateId, tenantIds } of Object.values(byFreelancer)) {
    // Get subscription plans for these tenants to calculate revenue
    const { data: subs } = await supabase
      .from('tenant_subscriptions')
      .select('plan_id, status')
      .in('tenant_id', tenantIds)
      .in('status', ['active'])

    if (!subs?.length) continue

    const totalRevenue = subs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan_id] ?? 0), 0)
    const commission = Math.round(totalRevenue * COMMISSION_RATE)
    if (commission <= 0) continue

    // Upsert commission for this period (idempotent)
    await supabase.from('commission_ledger').upsert({
      freelancer_id: freelancerId,
      template_id: templateId,
      amount: commission,
      period,
      tenant_count: subs.length,
      status: 'pending',
    }, { onConflict: 'freelancer_id,template_id,period', ignoreDuplicates: false })

    // Update total_earnings on freelancer
    await supabase.rpc('increment_freelancer_earnings', { fid: freelancerId, amount: commission })

    processed++
  }

  return NextResponse.json({ ok: true, processed, period })
}
