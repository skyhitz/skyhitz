import { HomeScreen } from 'app/features/home/screen'
import { Post } from 'app/types'
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
