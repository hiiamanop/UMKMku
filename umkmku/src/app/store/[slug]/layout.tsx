import { createServiceClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/tenant'
import { StoreNavbar } from '@/components/store/store-navbar'
import { FashionNavbar } from '@/components/templates/fashion/fashion-navbar'
import { ParfumNavbar } from '@/components/templates/parfum/parfum-navbar'
import { FnbNavbar } from '@/components/templates/fnb/fnb-navbar'
import { CartProvider } from '@/lib/cart-context'
import { notFound } from 'next/navigation'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) {
    const service = createServiceClient()
    const { data: inactiveTenant } = await service
      .from('tenants')
      .select('brand_name, slug')
      .eq('slug', slug)
      .eq('is_active', false)
      .maybeSingle()

    if (!inactiveTenant) notFound()

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full mx-4 rounded-2xl bg-white border border-gray-100 p-10 flex flex-col items-center gap-4 text-center shadow-sm">
          <div className="text-4xl">🏪</div>
          <h1 className="text-lg font-bold text-gray-900">{inactiveTenant.brand_name}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Toko ini sedang tidak aktif untuk sementara. Silakan kembali lagi nanti.
          </p>
        </div>
      </div>
    )
  }

  const { tenant } = data

  return (
    <div
      style={{
        '--color-primary': tenant.primary_color,
        '--color-secondary': tenant.secondary_color,
        '--color-accent': tenant.accent_color,
      } as React.CSSProperties}
    >
      <CartProvider slug={slug}>
        {tenant.category === 'fashion'
          ? <FashionNavbar tenant={tenant} />
          : tenant.category === 'parfum'
            ? <ParfumNavbar tenant={tenant} />
            : tenant.category === 'fdb'
              ? <FnbNavbar tenant={tenant} />
              : <StoreNavbar tenant={tenant} />}
        {children}
      </CartProvider>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) return {}

  const { tenant } = data
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const isLocal = rootDomain.startsWith('localhost')
  const storeUrl = isLocal
    ? `http://${rootDomain}/store/${slug}`
    : `https://${slug}.${rootDomain}`

  const title = `${tenant.brand_name}${tenant.tagline ? `, ${tenant.tagline}` : ''}`
  const description = tenant.description ?? `Toko resmi ${tenant.brand_name}. Produk skincare lokal Indonesia terbaik.`
  const image = tenant.hero_image_url ?? tenant.logo_url ?? null

  return {
    title: { default: title, template: `%s, ${tenant.brand_name}` },
    description,
    alternates: { canonical: storeUrl },
    openGraph: {
      type: 'website',
      url: storeUrl,
      siteName: tenant.brand_name,
      title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: tenant.brand_name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
