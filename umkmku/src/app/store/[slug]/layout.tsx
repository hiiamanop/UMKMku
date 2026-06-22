import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { StoreNavbar } from '@/components/store/store-navbar'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  const { tenant } = data

  return (
    <div
      style={{
        '--color-primary': tenant.primary_color,
        '--color-secondary': tenant.secondary_color,
        '--color-accent': tenant.accent_color,
      } as React.CSSProperties}
    >
      <StoreNavbar tenant={tenant} />
      {children}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) return {}

  return {
    title: `${data.tenant.brand_name}${data.tenant.tagline ? ` — ${data.tenant.tagline}` : ''}`,
    description: data.tenant.description ?? undefined,
  }
}
