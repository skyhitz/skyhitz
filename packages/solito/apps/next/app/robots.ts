import type { MetadataRoute } from 'next'
import { Config } from 'app/config'

export default function robots(): MetadataRoute.Robots {
  const base = Config.APP_URL
  
  // Private/authenticated routes that shouldn't be indexed
  const disallow = [
    '/sign-in',
    '/sign-in-with-token',
    '/sign-up',
    '/top-up',
    '/profile',
    '/profile/*',
  ]

  // AI-specific crawlers with explicit allow/disallow rules
  const aiCrawlers = [
    'GPTBot',           // OpenAI ChatGPT
    'ChatGPT-User',     // OpenAI user agent
    'CCBot',            // Common Crawl (used by many AI)
    'ClaudeBot',        // Anthropic Claude
    'Claude-Web',       // Anthropic Claude web crawler
    'anthropic-ai',     // Anthropic general
    'Google-Extended',  // Google Gemini/Bard
    'GoogleOther',      // Google AI services
    'Applebot-Extended', // Apple Intelligence
    'PerplexityBot',    // Perplexity AI
    'FacebookBot',      // Meta AI
    'Meta-ExternalAgent', // Meta AI services
    'Meta-ExternalCrawler', // Meta AI
    'Grok',             // xAI Grok
    'GrokBot',          // xAI Grok bot
    'xai-crawler',      // xAI crawler
    'xAIBot',           // xAI bot
    'Bytespider',       // ByteDance (TikTok) AI
    'Omgilibot',        // Omgili crawler
    'Diffbot',          // Diffbot AI
    'cohere-ai',        // Cohere AI
  ]

  const rules: MetadataRoute.Robots['rules'] = [
    // Default rule for all bots
    { 
      userAgent: '*', 
      allow: '/', 
      disallow,
      crawlDelay: 1,
    },
  ]

  // Add specific rules for each AI crawler
  aiCrawlers.forEach(bot => {
    rules.push({
      userAgent: bot,
      allow: '/',
      disallow,
      crawlDelay: 2, // Slightly higher delay for AI crawlers
    })
  })

  return {
    rules,
    sitemap: [
      `${base}/sitemap.xml`,
      // Include docs sitemap if available
      'https://docs.skyhitz.io/sitemap.xml',
    ],
    host: base,
  }
}


