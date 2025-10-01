import * as React from 'react'
import { BlogScreen } from './screen'
import { fetchBlogPosts } from 'app/api/algolia'
import { Post } from 'app/types/index'
import { View, ActivityIndicator } from 'react-native'
import { P } from 'app/design/typography'

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
        const blogPosts = await fetchBlogPosts()
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
