import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

export async function GET(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied

  const tenantId = req.nextUrl.searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })

  const db = createServiceClient()
  const { data: orders } = await db
    .from('top_up_orders')
    .select('*, top_up_packages(name, transaction_quota)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [] })
}
