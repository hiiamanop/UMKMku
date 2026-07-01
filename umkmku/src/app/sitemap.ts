import { createServiceClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const [{ data: tenants }, { data: articles }] = await Promise.all([
    supabase.from('tenants').select('slug').eq('is_active', true),
    supabase.from('articles').select('slug, published_at').eq('status', 'published'),
  ])

  const storeUrls: MetadataRoute.Sitemap = (tenants ?? []).map((t) => ({
    url: `https://${t.slug}.umkmu.site`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const articleUrls: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `https://www.umkmu.site/insight/${a.slug}`,
    lastModified: a.published_at ? new Date(a.published_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    { url: 'https://www.umkmu.site', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://www.umkmu.site/insight', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://www.umkmu.site/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://www.umkmu.site/insight', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://www.umkmu.site/templates', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://www.umkmu.site/freelancer/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticUrls, ...articleUrls, ...storeUrls]
}
