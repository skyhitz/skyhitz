import type { MetadataRoute } from 'next'
import { Config } from 'app/config'

export default function robots(): MetadataRoute.Robots {
  const base = Config.APP_URL
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/sign-in',
        '/sign-in-with-token',
        '/sign-up',
        '/top-up',
        '/profile',
        '/profile/*',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}


