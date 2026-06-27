import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth: hanya super_admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { tenantId, subscriptionId, action, planId } = await req.json()
  if (!tenantId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const now = new Date()
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()

  if (action === 'activate' || action === 'change-plan') {
    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })

    if (subscriptionId) {
      await service
        .from('tenant_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd,
          ai_tokens_used: 0,
          transactions_used: 0,
          notified_80pct: false,
          suspended_notified: false,
        })
        .eq('id', subscriptionId)
    } else {
      await service
        .from('tenant_subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd,
        })
    }

    // Aktifkan toko
    await service.from('tenants').update({ is_active: true }).eq('id', tenantId)
    return NextResponse.json({ ok: true })
  }

  if (action === 'suspend') {
    if (subscriptionId) {
      await service
        .from('tenant_subscriptions')
        .update({ status: 'suspended' })
        .eq('id', subscriptionId)
    }
    await service.from('tenants').update({ is_active: false }).eq('id', tenantId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
