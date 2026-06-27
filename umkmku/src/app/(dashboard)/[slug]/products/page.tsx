import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductList } from './_components/product-list'
import { Pagination } from '../_components/pagination'

const PAGE_SIZE = 10

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) notFound()

  const from = (page - 1) * PAGE_SIZE
  const { data: products, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  return (
    <div>
      <ProductList slug={slug} products={products ?? []} />
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={`/${slug}/products`} />
    </div>
  )
}
