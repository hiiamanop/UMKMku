import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  // Verify order belongs to this user
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order || order.status !== 'shipped') {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
  }

  // Use service client to bypass RLS for update
  const service = createServiceClient()
  await service.from('orders').update({ status: 'delivered' }).eq('id', orderId)
  await service.from('order_chats').insert({
    order_id: orderId,
    role: 'user',
    content: 'Paket sudah diterima ✓',
  })

  return NextResponse.json({ success: true })
}
