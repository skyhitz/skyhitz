import type { MetadataRoute } from 'next'
import { Config } from 'app/config'
import { fetchBlogPosts } from 'app/api/algolia'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = Config.APP_URL

  // Static routes
  const routes: MetadataRoute.Sitemap = ['', '/search', '/chart', '/terms', '/privacy', '/blog'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  )

  // Blog routes
  const blog = await fetchBlogPosts()
  const blogRoutes: MetadataRoute.Sitemap = blog.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: new Date(post.publishedAtTimestamp),
  }))

  return [...routes, ...blogRoutes]
}


