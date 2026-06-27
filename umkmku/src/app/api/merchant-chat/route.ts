import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verifyMerchantOwnsOrder(slug: string, orderId: string) {
  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id, owner_id').eq('slug', slug).single()
  if (!tenant) return null
  const { data: order } = await supabase
    .from('orders').select('id, status, total_amount, customer_name')
    .eq('id', orderId).eq('tenant_id', tenant.id).single()
  if (!order) return null
  return { tenant, order }
}

// GET /api/merchant-chat?orderId=xxx&slug=xxx — load messages for merchant dashboard
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  const slug = req.nextUrl.searchParams.get('slug')
  if (!orderId || !slug) return NextResponse.json({ error: 'orderId and slug required' }, { status: 400 })

  const result = await verifyMerchantOwnsOrder(slug, orderId)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = createServiceClient()
  const { data: messages } = await supabase
    .from('order_chats').select('*').eq('order_id', orderId).order('created_at', { ascending: true })

  return NextResponse.json({ messages: messages ?? [], order: result.order })
}

// POST /api/merchant-chat — merchant kirim pesan manual
export async function POST(req: NextRequest) {
  const { slug, orderId, content } = await req.json()
  if (!slug || !orderId || !content?.trim()) {
    return NextResponse.json({ error: 'slug, orderId, content required' }, { status: 400 })
  }

  // Verifikasi session merchant = owner toko
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await verifyMerchantOwnsOrder(slug, orderId)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (result.tenant.owner_id && result.tenant.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data: message, error } = await service.from('order_chats').insert({
    order_id: orderId,
    role: 'assistant',
    sender_type: 'merchant',
    content: content.trim(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to send' }, { status: 500 })

  return NextResponse.json({ message })
}
