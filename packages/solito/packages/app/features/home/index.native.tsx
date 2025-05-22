import * as React from 'react'
import { HomeScreen } from './screen'
import { fetchHomePagePosts } from 'app/api/algolia'
import { Post } from 'app/types/index'
import { View } from 'react-native'
import { P, ActivityIndicator } from 'app/design/typography'
import { homeContent } from 'app/constants/content'

// Native-specific home screen wrapper that handles data loading
export function HomeScreenNative() {
  const [loading, setLoading] = React.useState(true)
  const [posts, setPosts] = React.useState<Post[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Fetch posts on component mount
    const loadPosts = async () => {
      try {
        setLoading(true)
        const fetchedPosts = await fetchHomePagePosts()
        setPosts(fetchedPosts)
        setError(null)
      } catch (err) {
        setError((err as Error).message || 'Failed to load home page content')
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  // Show a loading indicator while data is being fetched
  if (loading && posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Show error message if fetch failed
  if (error && posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <P className="text-center text-red-500">
          Error loading content: {error}
        </P>
      </View>
    )
  }

  // Render the HomeScreen with the fetched posts and static content
  return <HomeScreen posts={posts} {...homeContent} />
}

// Default export for native
export default HomeScreenNative
