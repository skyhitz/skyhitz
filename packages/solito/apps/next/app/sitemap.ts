import type { MetadataRoute } from 'next'
import { Config } from 'app/config'
import { fetchBlogPosts } from 'app/api/algolia'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = Config.APP_URL

  // Static routes
  const routes = ['', '/search', '/chart', '/terms', '/privacy', '/blog'].map(
    (route) => ({ url: `${baseUrl}${route}`, changeFrequency: 'weekly', priority: 0.7 })
  )

  // Blog routes
  const blog = await fetchBlogPosts()
  const blogRoutes = blog.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
    lastModified: new Date(post.publishedAtTimestamp),
  }))

  return [...routes, ...blogRoutes]
}


