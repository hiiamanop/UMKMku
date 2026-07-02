import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { packageId, tenantId, quantity = 1 } = await req.json()
  if (!packageId || !tenantId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const db = createServiceClient()

  const { data: tenant } = await db.from('tenants').select('owner_id').eq('id', tenantId).single()
  if (!tenant || tenant.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: pkg } = await db.from('top_up_packages').select('*').eq('id', packageId).eq('is_active', true).single()
  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  const qty = Math.max(1, Math.min(10, Number(quantity)))
  const amount = pkg.price * qty

  const { data: order } = await db.from('top_up_orders')
    .insert({ tenant_id: tenantId, package_id: packageId, quantity: qty, amount, status: 'pending' })
    .select('id')
    .single()

  if (!order) return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })

  const { data: qrisSetting } = await db.from('platform_settings').select('value').eq('key', 'qris_url').maybeSingle()
  const qrisUrl = qrisSetting?.value ?? process.env.PLATFORM_QRIS_URL ?? null

  return NextResponse.json({ orderId: order.id, qrisUrl })
}
