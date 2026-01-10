import type { MetadataRoute } from 'next'
import { Config } from 'app/config'

export default function robots(): MetadataRoute.Robots {
  const base = Config.APP_URL

  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
    host: base,
  }
}
