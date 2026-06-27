import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { StoreFooter } from '@/components/store/store-footer'
import { ProductCard } from '@/components/store/product-card'
import { ParfumProductCard } from '@/components/templates/parfum/parfum-product-card'
import { FnbProductCard } from '@/components/templates/fnb/fnb-product-card'
import { FnbFooter } from '@/components/templates/fnb/fnb-footer'
import { ProductDetailClient } from './_product-detail-client'

interface Props {
  params: Promise<{ slug: string; id: string }>
}

const SHIPPING_TEXT = 'Pengiriman gratis untuk pembelian di atas Rp 300.000. Kami menerima pengembalian dalam 7 hari untuk produk yang belum dibuka. Kemasan kami 100% dapat didaur ulang.'

export async function generateMetadata({ params }: Props) {
  const { slug, id } = await params
  const supabase = createServiceClient()
  const [{ data: tenant }, { data: product }] = await Promise.all([
    supabase.from('tenants').select('brand_name, hero_image_url, logo_url, category').eq('slug', slug).single(),
    supabase.from('products').select('name, description, price, image_url').eq('id', id).single(),
  ])
  if (!tenant || !product) return {}

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const isLocal = rootDomain.startsWith('localhost')
  const storeUrl = isLocal ? `http://${rootDomain}/store/${slug}` : `https://${slug}.${rootDomain}`
  const productUrl = `${storeUrl}/products/${id}`
  const title = product.name
  const description = product.description ?? `${product.name} dari ${tenant.brand_name}.`
  const image = product.image_url ?? tenant.hero_image_url ?? null

  return {
    title,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      type: 'website',
      url: productUrl,
      title: `${title} — ${tenant.brand_name}`,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 1200, alt: title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} — ${tenant.brand_name}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug, id } = await params
  const supabase = createServiceClient()

  const [{ data: tenant }, { data: product }] = await Promise.all([
    supabase.from('tenants').select('*').eq('slug', slug).single(),
    supabase.from('products').select('*').eq('id', id).single(),
  ])

  if (!tenant || !product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .neq('id', id)
    .eq('is_active', true)
    .limit(4)

  const marketplaceUrl = product.tokopedia_url || product.shopee_url

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const isLocal = rootDomain.startsWith('localhost')
  const storeUrl = isLocal ? `http://${rootDomain}/store/${slug}` : `https://${slug}.${rootDomain}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.image_url ?? undefined,
    url: `${storeUrl}/products/${id}`,
    brand: { '@type': 'Brand', name: tenant.brand_name },
    ...(product.price ? {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'IDR',
        price: product.price,
        availability: product.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: marketplaceUrl ?? `${storeUrl}/products/${id}`,
      }
    } : {}),
  }

  // ── PARFUM product detail ─────────────────────────────────────────────────────
  if (product.category_type === 'parfum' || tenant.category === 'parfum') {
    const parfumData = product.parfum_data ?? {}
    const notesTop: string[] = parfumData.notes_top ?? []
    const notesMiddle: string[] = parfumData.notes_middle ?? []
    const notesBase: string[] = parfumData.notes_base ?? []
    const longevity: string | undefined = parfumData.longevity
    const size: number | undefined = parfumData.size
    const fragranceFamily: string | undefined = parfumData.fragrance_family

    const accordions = [
      {
        key: 'how_to_use',
        label: 'HOW TO WEAR',
        content: product.how_to_use ?? 'Apply to pulse points — wrists, neck, and behind the ears. Allow the warmth of your skin to lift the fragrance and let it evolve throughout the day.',
      },
      { key: 'shipping', label: 'SHIPPING & RETURNS', content: SHIPPING_TEXT },
    ]

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="max-w-[1280px] mx-auto">
          {/* Product Hero */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 px-6 md:px-16 py-16 md:py-24">
            {/* Image */}
            <div className="md:col-span-7 flex justify-center items-start">
              <div className="w-full aspect-[3/4] bg-[var(--color-secondary)] relative overflow-hidden group max-w-[500px] mx-auto md:max-w-none">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 58vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-10">🌸</div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-5 flex flex-col justify-center">
              {/* Fragrance family badge */}
              {fragranceFamily && (
                <div className="mb-4">
                  <span className="text-[10px] tracking-[0.25em] uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1">
                    {fragranceFamily.toUpperCase()}
                  </span>
                </div>
              )}

              <h1 className="font-serif text-3xl md:text-4xl italic font-light text-[var(--color-primary)] mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Size + Longevity chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {size && (
                  <span className="text-[11px] tracking-wide border border-black/15 px-3 py-1 text-[var(--color-accent)]">
                    {size} ml
                  </span>
                )}
                {longevity && (
                  <span className="text-[11px] tracking-wide border border-black/15 px-3 py-1 text-[var(--color-accent)] capitalize">
                    {longevity}
                  </span>
                )}
              </div>

              {product.price && (
                <p className="text-lg text-[var(--color-accent)]/70 mb-6 tracking-wide">
                  IDR {product.price.toLocaleString('id-ID')}
                </p>
              )}

              {product.description && (
                <p className="text-base text-[var(--color-primary)]/60 leading-relaxed italic mb-8 border-l-2 border-[var(--color-primary)]/20 pl-5">
                  {product.description}
                </p>
              )}

              {/* Notes Pyramid */}
              {(notesTop.length > 0 || notesMiddle.length > 0 || notesBase.length > 0) && (
                <div className="mb-8 space-y-3 border-t border-black/10 pt-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)]/50 mb-4">
                    FRAGRANCE NOTES
                  </p>
                  {notesTop.length > 0 && (
                    <div className="flex gap-3 items-baseline">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-accent)]/40 w-16 shrink-0">
                        Top
                      </span>
                      <span className="text-sm text-[var(--color-primary)]/70">
                        {notesTop.join(' • ')}
                      </span>
                    </div>
                  )}
                  {notesMiddle.length > 0 && (
                    <div className="flex gap-3 items-baseline">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-accent)]/40 w-16 shrink-0">
                        Heart
                      </span>
                      <span className="text-sm text-[var(--color-primary)]/70">
                        {notesMiddle.join(' • ')}
                      </span>
                    </div>
                  )}
                  {notesBase.length > 0 && (
                    <div className="flex gap-3 items-baseline">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-accent)]/40 w-16 shrink-0">
                        Base
                      </span>
                      <span className="text-sm text-[var(--color-primary)]/70">
                        {notesBase.join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive: buy button + accordion */}
              <ProductDetailClient
                accordions={accordions}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  stock_quantity: product.stock_quantity ?? null,
                  is_preorder: product.is_preorder ?? false,
                }}
              />
            </div>
          </section>

          {/* The Ritual — dark banner */}
          <section
            className="px-6 md:px-16 py-20 flex flex-col md:flex-row items-center gap-16"
            style={{ background: 'var(--color-primary)' }}
          >
            <div className="w-full md:w-1/2">
              <h2 className="font-serif text-3xl italic font-light text-white mb-6">
                A fragrance is not simply worn — it becomes you.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Apply to pulse points and allow the warmth of your body to lift each note. Give it time — the truest expression of the fragrance comes after ten minutes on the skin.
              </p>
            </div>
            <div className="w-full md:w-1/2 h-[320px] overflow-hidden relative bg-white/5">
              {tenant.hero_image_url && (
                <Image src={tenant.hero_image_url} alt="Ritual" fill sizes="50vw" className="object-cover opacity-60" />
              )}
            </div>
          </section>

          {/* Related products */}
          {(related ?? []).length > 0 && (
            <section className="px-6 md:px-16 py-20">
              <h3 className="text-xl tracking-widest uppercase font-medium text-[var(--color-primary)] mb-10">
                EXTEND THE SCENT
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {(related ?? []).map((rp) => (
                  <ParfumProductCard key={rp.id} product={rp} slug={slug} />
                ))}
              </div>
            </section>
          )}
        </main>

        <StoreFooter tenant={tenant} />
      </>
    )
  }

  // ── FNB product detail ────────────────────────────────────────────────────────
  if (product.category_type === 'fdb' || tenant.category === 'fdb') {
    const fdbData = product.fdb_data ?? {}
    const dietary: string[] = fdbData.dietary ?? []
    const ingredients: string[] = fdbData.ingredients ?? []
    const allergens: string[] = fdbData.allergens ?? []
    const prepTime: number | undefined = fdbData.preparation_time
    const servings: number | undefined = fdbData.servings

    const DIETARY_EMOJI: Record<string, string> = {
      vegan: '🌱',
      'gluten-free': '🌾',
      halal: '☪️',
      organic: '🌿',
    }

    const accordions = [
      ...(ingredients.length > 0 ? [{
        key: 'ingredients',
        label: 'BAHAN-BAHAN',
        content: ingredients.join(', '),
      }] : []),
      ...(allergens.length > 0 ? [{
        key: 'allergens',
        label: 'ALERGEN',
        content: allergens.join(', '),
      }] : []),
      { key: 'shipping', label: 'PENGIRIMAN & PENGEMBALIAN', content: SHIPPING_TEXT },
    ]

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🍱</div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              {/* Dietary badges */}
              {dietary.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dietary.map((d) => (
                    <span key={d} className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full font-medium capitalize">
                      {DIETARY_EMOJI[d] ?? '✓'} {d}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>

              {product.description && (
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              )}

              {/* Specs */}
              <div className="flex flex-wrap gap-3">
                {prepTime && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-lg font-black text-gray-900">{prepTime}</p>
                    <p className="text-xs text-gray-400">menit</p>
                  </div>
                )}
                {servings && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-lg font-black text-gray-900">{servings}</p>
                    <p className="text-xs text-gray-400">porsi</p>
                  </div>
                )}
              </div>

              {product.price && (
                <p className="text-2xl font-black text-[var(--color-primary)]">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
              )}

              <ProductDetailClient
                accordions={accordions}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  stock_quantity: product.stock_quantity ?? null,
                  is_preorder: product.is_preorder ?? false,
                }}
              />
            </div>
          </div>

          {/* Related products */}
          {(related ?? []).length > 0 && (
            <section className="mt-16">
              <h3 className="text-xl font-black text-gray-900 mb-6">Menu Lainnya</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(related ?? []).map((rp) => (
                  <FnbProductCard key={rp.id} product={rp} slug={slug} />
                ))}
              </div>
            </section>
          )}
        </main>

        <FnbFooter tenant={tenant} />
      </>
    )
  }

  // ── DEFAULT (skincare + others) ───────────────────────────────────────────────
  const accordions = [
    {
      key: 'how_to_use',
      label: 'CARA PENGGUNAAN',
      content: product.how_to_use ?? product.description ?? 'Gunakan secukupnya pada kulit yang sudah bersih. Aplikasikan dengan gerakan memutar lembut hingga meresap sempurna.',
    },
    {
      key: 'ingredients',
      label: 'DAFTAR BAHAN',
      content: (product.ingredients ?? []).length > 0
        ? product.ingredients.join(', ')
        : 'Hubungi kami untuk informasi lengkap bahan-bahan produk ini.',
    },
    { key: 'shipping', label: 'PENGIRIMAN & PENGEMBALIAN', content: SHIPPING_TEXT },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[1280px] mx-auto">
        {/* Product Hero — 7/5 grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 px-6 md:px-16 py-16 md:py-24">
          {/* Image */}
          <div className="md:col-span-7 flex justify-center items-start">
            <div className="w-full aspect-[4/5] bg-[var(--color-secondary)] relative overflow-hidden group">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-10">🧴</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-5 flex flex-col justify-center">
            {product.usage_step && (
              <div className="mb-4">
                <span className="text-label-caps bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1">
                  {product.usage_step.toUpperCase()}
                </span>
              </div>
            )}

            <h1 className="text-headline-lg italic text-[var(--color-primary)] mb-3">{product.name}</h1>

            {product.price && (
              <p className="text-body-lg text-[var(--color-accent)]/60 mb-6">
                IDR {product.price.toLocaleString('id-ID')}
              </p>
            )}

            {product.description && (
              <p className="text-body-md text-[var(--color-accent)]/70 leading-relaxed italic mb-8 border-l-2 border-[var(--color-primary)]/30 pl-5">
                {product.description}
              </p>
            )}

            {/* Ingredient chips */}
            {(product.ingredients ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {product.ingredients.slice(0, 5).map((ing: string) => (
                  <span key={ing} className="text-label-caps text-[10px] bg-[var(--color-secondary)] border border-black/10 px-3 py-1.5 rounded-full">
                    {ing.toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            {/* Interactive: buy button + accordion */}
            <ProductDetailClient
              accordions={accordions}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                stock_quantity: product.stock_quantity ?? null,
                is_preorder: product.is_preorder ?? false,
              }}
            />
          </div>
        </section>

        {/* Nourished by Nature */}
        <section className="px-6 md:px-16 py-24 bg-[var(--color-secondary)] flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="text-display italic text-[var(--color-primary)] mb-6">
              Dirawat oleh Alam
            </h2>
            <p className="text-body-lg text-[var(--color-accent)]/70 leading-relaxed max-w-lg">
              Kami percaya perawatan kulit adalah perpanjangan dari kecerdasan alam.
              Setiap produk dibuat dari bahan-bahan alami pilihan yang dipanen pada puncak kualitasnya.
            </p>
          </div>
          <div className="w-full md:w-1/2 h-[400px] overflow-hidden relative bg-[var(--color-accent)]/20">
            {tenant.hero_image_url && (
              <Image src={tenant.hero_image_url} alt="Nature" fill sizes="50vw" className="object-cover" />
            )}
          </div>
        </section>

        {/* Complete your Ritual */}
        {(related ?? []).length > 0 && (
          <section className="px-6 md:px-16 py-20">
            <h3 className="text-headline-lg italic text-[var(--color-primary)] mb-10">
              Lengkapi Ritual Kamu
            </h3>
            <div className="flex gap-8 overflow-x-auto pb-6">
              {(related ?? []).map((rp) => (
                <div key={rp.id} className="flex-shrink-0 w-64">
                  <ProductCard product={rp} slug={slug} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <StoreFooter tenant={tenant} />
    </>
  )
}
