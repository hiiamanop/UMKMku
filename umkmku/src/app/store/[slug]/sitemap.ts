import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export default async function sitemap({ params }: { params: { slug: string } }): Promise<MetadataRoute.Sitemap> {
  const { slug } = params
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const isLocal = rootDomain.startsWith('localhost')
  const base = isLocal ? `http://${rootDomain}/store/${slug}` : `https://${slug}.${rootDomain}`

  const supabase = createServiceClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url: `${base}/products/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
