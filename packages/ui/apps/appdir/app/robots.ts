import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        disallow: [
          '/ipfs/',
          'http://ipfs.skyhitz.io/',
          'https://ipfs.skyhitz.io/',
        ],
      },
    ],
    sitemap: 'https://skyhitz.io/sitemap.xml',
  }
}
