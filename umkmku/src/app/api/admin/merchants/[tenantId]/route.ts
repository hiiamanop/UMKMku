import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const db = createServiceClient()

  const [{ data: tenant }, { data: sub }, { count: productCount }, { count: orderCount }] = await Promise.all([
    db.from('tenants').select('id, slug, brand_name, category, whatsapp_number, instagram_url, owner_id, created_at').eq('id', tenantId).single(),
    db.from('tenant_subscriptions').select('plan_id, status, trial_ends_at, current_period_start, current_period_end, ai_tokens_used, transactions_used').eq('tenant_id', tenantId).single(),
    db.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ])

  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Lookup owner email via auth.users
  let ownerEmail: string | null = null
  if (tenant.owner_id) {
    const { data: authUser } = await db.auth.admin.getUserById(tenant.owner_id)
    ownerEmail = authUser?.user?.email ?? null
  }

  return NextResponse.json({
    ...tenant,
    owner_email: ownerEmail,
    subscription: sub,
    product_count: productCount ?? 0,
    order_count: orderCount ?? 0,
  })
}
