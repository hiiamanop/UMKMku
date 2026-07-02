import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const db = createServiceClient()

  const { data: order } = await db
    .from('top_up_orders')
    .select('*, top_up_packages(transaction_quota)')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
  if (order.status === 'paid') return NextResponse.json({ ok: true, message: 'Sudah dikonfirmasi' })

  const totalQuota = (order.top_up_packages as { transaction_quota: number }).transaction_quota * (order.quantity ?? 1)

  await db.from('top_up_orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', orderId)

  const { data: sub } = await db.from('tenant_subscriptions').select('transactions_addon').eq('tenant_id', order.tenant_id).single()
  await db.from('tenant_subscriptions').update({ transactions_addon: (sub?.transactions_addon ?? 0) + totalQuota }).eq('tenant_id', order.tenant_id)

  return NextResponse.json({ ok: true })
}
