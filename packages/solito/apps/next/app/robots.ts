import type { MetadataRoute } from 'next'
import { Config } from 'app/config'

export default function robots(): MetadataRoute.Robots {
  const base = Config.APP_URL
  const disallow = [
    '/sign-in',
    '/sign-in-with-token',
    '/sign-up',
    '/top-up',
    '/profile',
    '/profile/*',
  ]
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'CCBot', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'anthropic-ai', allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
      { userAgent: 'Applebot-Extended', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'FacebookBot', allow: '/', disallow },
      { userAgent: 'Meta-ExternalCrawler', allow: '/', disallow },
      // xAI / Grok variations
      { userAgent: 'Grok', allow: '/', disallow },
      { userAgent: 'GrokBot', allow: '/', disallow },
      { userAgent: 'xai-crawler', allow: '/', disallow },
      { userAgent: 'xAIBot', allow: '/', disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}


