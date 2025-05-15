import type { MetadataRoute } from 'next'
import { blogIndex, ratingEntriesIndex, usersIndex } from 'app/api/algolia'
import { Post } from 'app/types'
import { Entry, PublicUser } from 'app/api/graphql'

const SITE_URL = 'https://skyhitz.io'

const lastModified = new Date()

const pages: MetadataRoute.Sitemap = [
  { url: SITE_URL, priority: 1, changeFrequency: 'weekly', lastModified },
  {
    url: `${SITE_URL}/blog`,
    priority: 0.9,
    changeFrequency: 'weekly',
    lastModified,
  },
  {
    url: `${SITE_URL}/chart`,
    priority: 0.8,
    changeFrequency: 'weekly',
    lastModified,
  },
  {
    url: `${SITE_URL}/search`,
    priority: 0.7,
    changeFrequency: 'weekly',
    lastModified,
  },
  {
    url: `${SITE_URL}/privacy`,
    priority: 0.5,
    changeFrequency: 'yearly',
    lastModified,
  },
  {
    url: `${SITE_URL}/terms`,
    priority: 0.5,
    changeFrequency: 'yearly',
    lastModified,
  },
]
const maxHitsPerPage = 1000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Google's limit is 50,000 URLs per sitemap
  const [{ hits: entries }, { hits: posts }, { hits: users }] =
    await Promise.all([
      await ratingEntriesIndex.search<Entry>('', {
        hitsPerPage: maxHitsPerPage,
      }),
      await blogIndex.search<Post>('', { hitsPerPage: maxHitsPerPage }),
      await usersIndex.search<PublicUser>('', { hitsPerPage: maxHitsPerPage }),
    ])

  const entriesPages: MetadataRoute.Sitemap = entries.map(({ id }) => ({
    url: `${SITE_URL}/beat/${id}`,
  }))

  const postsPages: MetadataRoute.Sitemap = posts.map(({ slug }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    priority: 0.8,
  }))

  const userPages: MetadataRoute.Sitemap = users.map(({ id }) => ({
    url: `${SITE_URL}/collector/${id}`,
  }))

  return [...pages, ...entriesPages, ...postsPages, ...userPages]
}
