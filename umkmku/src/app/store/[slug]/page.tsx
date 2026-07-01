import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySlug } from '@/lib/tenant'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTemplateHomePage } from '@/lib/templates/registry'
import { EditModeProvider } from '@/lib/edit-mode-context'
import { EditModeOverlay } from '@/components/store/edit-mode-overlay'
import type { Testimonial } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ edit?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) return { title: 'Toko tidak ditemukan' }

  const { tenant } = data
  const title = `${tenant.brand_name}, Toko Online`
  const description = tenant.tagline || tenant.description?.slice(0, 160) || `Belanja produk ${tenant.brand_name} secara online.`
  const image = tenant.hero_image_url || tenant.logo_url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://${tenant.slug}.umkmu.site`,
      siteName: tenant.brand_name,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: tenant.brand_name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function StorePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  const { tenant, products } = data
  const isEditMode = sp?.edit === '1'

  const supabase = createServiceClient()
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tenant.brand_name,
    description: tenant.description,
    url: `https://${tenant.slug}.umkmu.site`,
    ...(tenant.logo_url ? { image: tenant.logo_url } : {}),
    ...(tenant.whatsapp_number ? { telephone: tenant.whatsapp_number } : {}),
    address: { '@type': 'PostalAddress', addressCountry: 'ID' },
  }

  const HomePage = getTemplateHomePage(tenant.template_id, tenant.category)
  const content = (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage
        tenant={tenant}
        products={products}
        testimonials={(testimonials ?? []) as Testimonial[]}
      />
    </>
  )

  if (!isEditMode) return content

  // Verify ownership or super_admin
  let isOwner = false
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (user) {
      if (user.id === tenant.owner_id || !tenant.owner_id) {
        isOwner = true
      } else {
        const { data: profile } = await supabase
          .from('user_profiles').select('role').eq('id', user.id).single()
        isOwner = profile?.role === 'super_admin'
      }
    }
  } catch { /* not authenticated */ }

  if (!isOwner) return content

  return (
    <EditModeProvider slug={slug}>
      <EditModeOverlay slug={slug} />
      {content}
    </EditModeProvider>
  )
}
