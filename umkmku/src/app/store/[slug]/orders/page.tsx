import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { OrdersClient } from './_orders-client'
import { StoreFooter } from '@/components/store/store-footer'

interface Props { params: Promise<{ slug: string }> }

export default async function MyOrdersPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/store/${slug}/login`)

  const service = createServiceClient()
  const { data: tenant } = await service.from('tenants').select('*').eq('slug', slug).single()
  if (!tenant) return null

  const { data: orders } = await supabase
    .from('orders')
    .select(`id, created_at, status, total_amount, order_items(product_name, quantity, product_price)`)
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <OrdersClient slug={slug} tenant={tenant} orders={orders ?? []} />
      <StoreFooter tenant={tenant} />
    </>
  )
}
