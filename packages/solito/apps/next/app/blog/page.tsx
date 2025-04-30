import { BlogScreen } from 'app/features/blog/screen'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { Post } from 'app/types'
import { filter } from 'ramda'
import { isSome } from 'app/utils'
import JsonLdScript from 'app/seo/jsonLd'

async function getBlog() {
  try {
    const response = await algoliaClient.searchSingleIndex({
      indexName: indexNames.blog,
      searchParams: {
        query: '',
        page: 0,
        hitsPerPage: 20,
      }
    })
    
    return filter(isSome, response.hits as unknown as Post[]) as NonNullable<Post>[]
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export default async function BlogPage() {
  const blog = await getBlog()
  
  return (
    <>
      <BlogScreen posts={blog} />
      <JsonLdScript blog={blog} />
    </>
  )
}

export const metadata = {
  title: 'Skyhitz Blog',
  description: 'News and Updates from Skyhitz',
}
