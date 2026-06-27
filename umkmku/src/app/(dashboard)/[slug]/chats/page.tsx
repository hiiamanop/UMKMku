import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ChatsClient } from './_chats-client'
import { Pagination } from '../_components/pagination'

const PAGE_SIZE = 15

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; order?: string }>
}

export default async function ChatsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr, order } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) notFound()

  const from = (page - 1) * PAGE_SIZE
  const { data: orders, count } = await supabase
    .from('orders')
    .select('id, status, total_amount, customer_name, created_at', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (!orders || orders.length === 0) {
    return (
      <div>
        <ChatsClient slug={slug} threads={[]} />
        <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={`/${slug}/chats`} />
      </div>
    )
  }

  // Fetch only the latest message per order for sidebar preview
  // Full messages are loaded on-demand when merchant opens a thread
  const orderIds = orders.map((o: any) => o.id)
  const { data: lastChats } = await supabase
    .from('order_chats')
    .select('order_id, content, attachment_url, role, created_at')
    .in('order_id', orderIds)
    .order('created_at', { ascending: false })

  // Keep only the most recent message per order
  const lastByOrder: Record<string, any> = {}
  for (const chat of lastChats ?? []) {
    if (!lastByOrder[chat.order_id]) lastByOrder[chat.order_id] = chat
  }

  const threads = orders
    .filter((o: any) => lastByOrder[o.id])
    .map((o: any) => ({ order: o, lastMessage: lastByOrder[o.id] }))

  return (
    <div>
      <ChatsClient slug={slug} threads={threads} />
      <Pagination
        page={page} total={count ?? 0} pageSize={PAGE_SIZE}
        basePath={`/${slug}/chats`}
        searchParams={order ? { order } : {}}
      />
    </div>
  )
}
