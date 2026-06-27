import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const isLocal = rootDomain.startsWith('localhost')
  const sitemapBase = isLocal ? `http://${rootDomain}` : `https://${rootDomain}`

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/store/'],
        disallow: [
          '/store/*/checkout',
          '/store/*/cart',
          '/store/*/profile',
          '/store/*/orders',
          '/store/*/order/',
          '/store/*/login',
          '/store/*/register',
        ],
      },
    ],
    sitemap: `${sitemapBase}/sitemap.xml`,
  }
}
