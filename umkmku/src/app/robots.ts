import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
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
    sitemap: 'https://www.umkmu.site/sitemap.xml',
  }
}
