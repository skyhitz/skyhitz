import type { MetadataRoute } from 'next'
import { Config } from 'app/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = Config.APP_URL

  return [
    {
      url: baseUrl,
      changeFrequency: 'yearly',
      priority: 1.0,
    },
  ]
}
