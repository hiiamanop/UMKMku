import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { StoreFooter } from '@/components/store/store-footer'
import { ProfileClient } from './_profile-client'

const PAGE_SIZE = 10
const WISHLIST_PAGE_SIZE = 9

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; wpage?: string }>
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr, wpage: wpageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const wpage = Math.max(1, parseInt(wpageStr ?? '1'))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/store/${slug}/login`)

  const service = createServiceClient()
  const from = (page - 1) * PAGE_SIZE
  const wfrom = (wpage - 1) * WISHLIST_PAGE_SIZE

  const [
    { data: tenant },
    { data: profile },
    { data: orders, count: ordersCount },
    { data: wishlists, count: wishlistCount },
    { data: products },
  ] = await Promise.all([
    service.from('tenants').select('*').eq('slug', slug).single(),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*, order_items(*)', { count: 'exact' }).eq('user_id', user.id)
      .order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1),
    supabase.from('wishlists').select('product_id, products(*)', { count: 'exact' }).eq('user_id', user.id)
      .range(wfrom, wfrom + WISHLIST_PAGE_SIZE - 1),
    service.from('products').select('*').eq('is_active', true)
      .order('sort_order', { ascending: true }).limit(3),
  ])

  if (!tenant) notFound()

  const wishlistProducts = (wishlists ?? [])
    .map((w: any) => w.products)
    .filter((p: any) => p && p.tenant_id === tenant.id)

  const featuredProducts = (products ?? []).filter((p: any) => p.tenant_id === tenant.id)

  return (
    <>
      <ProfileClient
        tenant={tenant}
        user={{ id: user.id, email: user.email ?? '' }}
        profile={profile ?? null}
        orders={orders ?? []}
        ordersPage={page}
        ordersTotal={ordersCount ?? 0}
        ordersPageSize={PAGE_SIZE}
        wishlistPage={wpage}
        wishlistTotal={wishlistCount ?? 0}
        wishlistPageSize={WISHLIST_PAGE_SIZE}
        wishlistProducts={wishlistProducts}
        featuredProducts={featuredProducts}
        slug={slug}
      />
      <StoreFooter tenant={tenant} />
    </>
  )
}
