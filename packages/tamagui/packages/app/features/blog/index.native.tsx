import * as React from 'react'
import { BlogScreen } from './screen'
import { fetchBlogPosts } from 'app/api/algolia'
import { Post } from 'app/types/index'
import { YStack } from 'tamagui'
import { P, ActivityIndicator } from 'app/design/typography'

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
      <YStack flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" />
        <P marginTop="$4" textAlign="center">Loading blog posts...</P>
      </YStack>
    )
  }

  // Show error message if fetch failed
  if (error && posts.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <P textAlign="center" color="$red9" marginBottom="$4">{error}</P>
      </YStack>
    )
  }

  // Render the BlogScreen with the fetched posts
  return <BlogScreen posts={posts} />
}

// Re-export the standard BlogScreen for use in other contexts
export { BlogScreen }
