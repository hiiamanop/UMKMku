import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: tenant } = await db.from('tenants').select('owner_id').eq('id', tenantId).single()
  if (!tenant || tenant.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await db
    .from('tenant_subscriptions')
    .select('ai_tokens_used, transactions_used, overage_transactions, transactions_addon, transactions_addon_used')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  return NextResponse.json(data ?? {})
}
