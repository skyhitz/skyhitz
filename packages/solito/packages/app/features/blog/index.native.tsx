import * as React from 'react'
import { BlogScreen } from './screen'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { filter } from 'ramda'
import { isSome } from 'app/utils'
// Define Post type locally since it may not be exported from app/types
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
import { View, ActivityIndicator } from 'react-native'
import { P } from 'app/design/typography'

// Separate function to fetch initial blog posts
// This mirrors the server-side logic in the Next.js app
async function fetchInitialBlogPosts() {
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

// Native-specific blog screen wrapper that handles data loading
export function BlogScreenNative() {
  const [loading, setLoading] = React.useState(true)
  const [posts, setPosts] = React.useState<Post[]>([])
  const [error, setError] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    // Fetch blog posts on component mount
    const loadBlogPosts = async () => {
      try {
        setLoading(true)
        const blogPosts = await fetchInitialBlogPosts()
        setPosts(blogPosts)
        setError(null)
      } catch (err) {
        console.error('Failed to load blog posts:', err)
        setError('Failed to load blog posts. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    loadBlogPosts()
  }, [])
  
  // Show a loading indicator while data is being fetched
  if (loading && posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="var(--primary-color)" />
        <P className="mt-4 text-center">Loading blog posts...</P>
      </View>
    )
  }
  
  // Show error message if fetch failed
  if (error && posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <P className="text-center text-red-500 mb-4">{error}</P>
      </View>
    )
  }
  
  // Render the BlogScreen with the fetched posts
  return <BlogScreen posts={posts} />
}

// Re-export the standard BlogScreen for use in other contexts
export { BlogScreen }
