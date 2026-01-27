import type { MetadataRoute } from 'next'
import { Config } from 'app/config'
import { fetchBlogPosts, entriesIndex, usersIndex, indexNames, algoliaClient } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'

// Revalidate sitemap every hour
export const revalidate = 3600

async function fetchAllEntries(): Promise<Entry[]> {
  const allEntries: Entry[] = []
  let page = 0
  const hitsPerPage = 1000

  try {
    // Fetch entries in batches using timestamp desc index for most recent first
    while (true) {
      const result = await algoliaClient.searchSingleIndex({
        indexName: indexNames.entriesTimestampDesc,
        searchParams: {
          query: '',
          page,
          hitsPerPage,
          attributesToRetrieve: ['id', 'publishedAtTimestamp'],
        },
      })

      const hits = (result.hits || []) as unknown as Entry[]
      allEntries.push(...hits)

      // Check if there are more pages
      if (hits.length < hitsPerPage) break
      page++

      // Safety limit to prevent infinite loops
      if (page > 100) break
    }

    return allEntries
  } catch (error) {
    console.error('Error fetching entries for sitemap:', error)
    return []
  }
}

async function fetchAllUsers(): Promise<{ id: string; publishedAtTimestamp?: number }[]> {
  const allUsers: { id: string; publishedAtTimestamp?: number }[] = []
  let page = 0
  const hitsPerPage = 1000

  try {
    while (true) {
      const result = await usersIndex.search('', {
        page,
        hitsPerPage,
        attributesToRetrieve: ['objectID', 'publishedAtTimestamp'],
      })

      const hits = (result.hits || []).map((hit: any) => ({
        id: hit.objectID,
        publishedAtTimestamp: hit.publishedAtTimestamp,
      }))
      allUsers.push(...hits)

      if (hits.length < hitsPerPage) break
      page++

      // Safety limit
      if (page > 50) break
    }

    return allUsers
  } catch (error) {
    console.error('Error fetching users for sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = Config.APP_URL

  // Static routes with appropriate priorities
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/chart`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Fetch all dynamic content in parallel
  const [blogPosts, entries, users] = await Promise.all([
    fetchBlogPosts(),
    fetchAllEntries(),
    fetchAllUsers(),
  ])

  // Blog routes
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: post.publishedAtTimestamp
      ? new Date(post.publishedAtTimestamp * 1000)
      : undefined,
  }))

  // Music entry routes - high priority for SEO
  const entryRoutes: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${baseUrl}/music/${entry.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    lastModified: entry.publishedAtTimestamp
      ? new Date(
          typeof entry.publishedAtTimestamp === 'number'
            ? entry.publishedAtTimestamp * 1000
            : parseInt(entry.publishedAtTimestamp as any) * 1000
        )
      : undefined,
  }))

  // User profile routes
  const userRoutes: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${baseUrl}/users/${user.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
    lastModified: user.publishedAtTimestamp
      ? new Date(
          typeof user.publishedAtTimestamp === 'number'
            ? user.publishedAtTimestamp * 1000
            : parseInt(user.publishedAtTimestamp as any) * 1000
        )
      : undefined,
  }))

  console.log(
    `Sitemap generated: ${staticRoutes.length} static, ${blogRoutes.length} blog, ${entryRoutes.length} entries, ${userRoutes.length} users`
  )

  return [...staticRoutes, ...blogRoutes, ...entryRoutes, ...userRoutes]
}
