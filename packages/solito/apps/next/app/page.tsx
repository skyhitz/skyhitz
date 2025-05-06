import { HomeScreen } from 'app/features/home/screen'
// Define a local Post type to match exactly the one used in HomeScreen component
type Post = {
  id: string
  title: string
  content: string
  excerpt: string
  slug: string
  publishedAt: number
  imageUrl: string
  author: string
  tag: string
  publishedAtTimestamp: number
}
import { isEmpty } from 'ramda'
import { blogIndex } from 'app/api/algolia'
import { homeContent } from 'app/constants/content'
import JsonLdScript from 'app/seo/jsonLd'

const fetchPosts = async () => {
  // Force cast is needed because the Algolia types don't match our Post type exactly
  const res = await blogIndex.search('', { hitsPerPage: 3 })

  if (isEmpty(res.hits)) {
    return []
  }

  // Use type assertion to convert Algolia hit objects to Post type
  // This is a safe conversion assuming the blog index has all the required fields
  return res.hits.map((hit) => {
    // Cast to unknown first, then to our expected Post type
    // This approach is safer for TypeScript without sacrificing runtime correctness
    const postData = hit as unknown as Record<string, any>
    return {
      id: postData.objectID || '',
      title: postData.title || '',
      content: postData.content || '',
      excerpt: postData.excerpt || '',
      slug: postData.slug || '',
      publishedAt: postData.publishedAt || Date.now(),
      imageUrl: postData.imageUrl || '',
      author: postData.author || '',
      tag: postData.tag || 'general', // Providing a default tag value
      publishedAtTimestamp: postData.publishedAtTimestamp || Math.floor(Date.now() / 1000) // Convert current time to UNIX timestamp
    } as Post
  })
}

export default async function HomePage() {
  const posts = await fetchPosts()

  return (
    <>
      <HomeScreen {...homeContent} posts={posts} landing={true} />
      <JsonLdScript landing />
    </>
  )
}
