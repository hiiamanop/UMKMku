import { notFound } from 'next/navigation'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { ShopPage } from '@/components/store/shop-page'
import { StoreFooter } from '@/components/store/store-footer'
import { ParfumShopPage } from '@/components/templates/parfum/parfum-shop-page'
import { FashionShopPage } from '@/components/templates/fashion/fashion-shop-page'
import { FnbShopPage } from '@/components/templates/fnb/fnb-shop-page'
import { FnbFooter } from '@/components/templates/fnb/fnb-footer'

const LIMIT = 12
const ALL_SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal']

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    // skincare
    skin_types?: string
    concerns?: string
    // parfum
    families?: string
    longevities?: string
    // fashion
    sizes?: string
    styles?: string
    // fnb
    dietary?: string
    // shared
    sort?: string
  }>
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const page = Math.max(1, Number(sp.page ?? 1))
  const sort = sp.sort ?? 'newest'
  const offset = (page - 1) * LIMIT

  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants').select('*').eq('slug', slug).eq('is_active', true).single()
  if (!tenant) notFound()

  // Fetch current user's wishlist
  let wishedProductIds: string[] = []
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (user) {
    const { data: wishlists } = await userClient.from('wishlists')
      .select('product_id').eq('user_id', user.id)
    wishedProductIds = (wishlists ?? []).map((w: { product_id: string }) => w.product_id)
  }

  // ── PARFUM ───────────────────────────────────────────────────────────────────
  if (tenant.category === 'parfum') {
    const selectedFamilies = sp.families?.split(',').filter(Boolean) ?? []
    const selectedLongevities = sp.longevities?.split(',').filter(Boolean) ?? []

    // Fetch all parfum_data to build filter options
    const { data: allForOptions } = await supabase
      .from('products')
      .select('parfum_data')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    const familyOptions = [...new Set(
      (allForOptions ?? [])
        .map((p: { parfum_data: { fragrance_family?: string } | null }) => p.parfum_data?.fragrance_family)
        .filter((f): f is string => Boolean(f))
    )].sort()

    const longevityOptions = [...new Set(
      (allForOptions ?? [])
        .map((p: { parfum_data: { longevity?: string } | null }) => p.parfum_data?.longevity)
        .filter((l): l is string => Boolean(l))
    )].sort()

    // Build filtered query, Supabase doesn't support JSON filter directly,
    // so we fetch all and filter in JS for parfum_data fields
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('sort_order', { ascending: true })

    const { data: allProducts, count: rawCount } = await query

    // Client-side filter on JSON fields
    let filtered = allProducts ?? []
    if (selectedFamilies.length > 0) {
      filtered = filtered.filter((p) =>
        p.parfum_data?.fragrance_family && selectedFamilies.includes(p.parfum_data.fragrance_family)
      )
    }
    if (selectedLongevities.length > 0) {
      filtered = filtered.filter((p) =>
        p.parfum_data?.longevity && selectedLongevities.includes(p.parfum_data.longevity)
      )
    }

    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / LIMIT)
    const products = filtered.slice(offset, offset + LIMIT)

    return (
      <>
        <ParfumShopPage
          tenant={tenant}
          products={products}
          slug={slug}
          totalCount={totalCount}
          currentPage={page}
          totalPages={totalPages}
          familyOptions={familyOptions}
          longevityOptions={longevityOptions}
          initialFamilies={selectedFamilies}
          initialLongevities={selectedLongevities}
          initialSort={sort}
        />
        <StoreFooter tenant={tenant} />
      </>
    )
  }

  // ── FNB ──────────────────────────────────────────────────────────────────────
  if (tenant.category === 'fdb') {
    const selectedDietary = sp.dietary?.split(',').filter(Boolean) ?? []

    const { data: allForOptions } = await supabase
      .from('products')
      .select('fdb_data')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    const dietaryOptions = [...new Set(
      (allForOptions ?? [])
        .flatMap((p: { fdb_data: { dietary?: string[] } | null }) => p.fdb_data?.dietary ?? [])
    )].sort()

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('sort_order', { ascending: true })

    const { data: allProducts } = await query

    let filtered = allProducts ?? []
    if (selectedDietary.length > 0) {
      filtered = filtered.filter((p) =>
        p.fdb_data?.dietary?.some((d: string) => selectedDietary.includes(d))
      )
    }

    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / LIMIT)
    const products = filtered.slice(offset, offset + LIMIT)

    return (
      <>
        <FnbShopPage
          tenant={tenant}
          products={products}
          slug={slug}
          totalCount={totalCount}
          currentPage={page}
          totalPages={totalPages}
          dietaryOptions={dietaryOptions}
          initialDietary={selectedDietary}
          initialSort={sort}
        />
        <FnbFooter tenant={tenant} />
      </>
    )
  }

  // ── FASHION ──────────────────────────────────────────────────────────────────
  if (tenant.category === 'fashion') {
    const selectedSizes = sp.sizes?.split(',').filter(Boolean) ?? []
    const selectedStyles = sp.styles?.split(',').filter(Boolean) ?? []

    const { data: allForOptions } = await supabase
      .from('products')
      .select('fashion_data')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    const sizeOptions = [...new Set(
      (allForOptions ?? [])
        .flatMap((p: { fashion_data: { sizes?: string[] } | null }) => p.fashion_data?.sizes ?? [])
    )].sort()

    const styleOptions = [...new Set(
      (allForOptions ?? [])
        .map((p: { fashion_data: { style?: string } | null }) => p.fashion_data?.style)
        .filter((s): s is string => Boolean(s))
    )].sort()

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('sort_order', { ascending: true })

    const { data: allProducts } = await query

    let filtered = allProducts ?? []
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.fashion_data?.sizes?.some((s: string) => selectedSizes.includes(s))
      )
    }
    if (selectedStyles.length > 0) {
      filtered = filtered.filter((p) =>
        p.fashion_data?.style && selectedStyles.includes(p.fashion_data.style)
      )
    }

    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / LIMIT)
    const products = filtered.slice(offset, offset + LIMIT)

    return (
      <>
        <FashionShopPage
          tenant={tenant}
          products={products}
          slug={slug}
          totalCount={totalCount}
          currentPage={page}
          totalPages={totalPages}
          sizeOptions={sizeOptions}
          styleOptions={styleOptions}
          initialSizes={selectedSizes}
          initialStyles={selectedStyles}
          initialSort={sort}
        />
        <StoreFooter tenant={tenant} />
      </>
    )
  }

  // ── SKINCARE (default) ────────────────────────────────────────────────────────
  const selectedSkinTypes = sp.skin_types?.split(',').filter(Boolean) ?? []
  const selectedConcerns = sp.concerns?.split(',').filter(Boolean) ?? []

  const { data: allForOptions } = await supabase
    .from('products')
    .select('skin_types, concerns')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)

  const skinTypeOptions = [...new Set(
    (allForOptions ?? []).flatMap((p: { skin_types: string[] | null }) =>
      (p.skin_types ?? []).flatMap((t: string) => t === 'all' ? ALL_SKIN_TYPES : [t])
    )
  )].sort()

  const concernOptions = [...new Set(
    (allForOptions ?? []).flatMap((p: { concerns: string[] | null }) => p.concerns ?? [])
  )].sort()

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)

  if (selectedSkinTypes.length > 0) {
    query = query.or(`skin_types.ov.{${selectedSkinTypes.join(',')}},skin_types.cs.{all}`)
  }
  if (selectedConcerns.length > 0) {
    query = query.overlaps('concerns', selectedConcerns)
  }

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('sort_order', { ascending: true })

  const { data: products, count } = await query.range(offset, offset + LIMIT - 1)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / LIMIT)

  return (
    <>
      <ShopPage
        tenant={tenant}
        products={products ?? []}
        slug={slug}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        skinTypeOptions={skinTypeOptions}
        concernOptions={concernOptions}
        initialSkinTypes={selectedSkinTypes}
        initialConcerns={selectedConcerns}
        initialSort={sort}
        wishedProductIds={wishedProductIds}
      />
      <StoreFooter tenant={tenant} />
    </>
  )
}
