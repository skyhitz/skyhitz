import * as React from 'react'
import { PostScreen } from './screen'
import { View, ActivityIndicator } from 'react-native'
import { P } from 'app/design/typography'
import { Navbar } from 'app/ui/navbar/Navbar'
import Footer from 'app/ui/footer'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { Post } from 'app/types/index'
import { fetchPost } from 'app/api/algolia'
import { useLocalSearchParams } from 'expo-router'

// Native-specific post screen wrapper that handles data loading
export function PostScreenNative() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const insets = useSafeArea()
  const [loading, setLoading] = React.useState(true)
  const [post, setPost] = React.useState<Post | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Fetch blog post on component mount
    const loadBlogPost = async () => {
      if (!slug) {
        setError('No post slug provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const blogPost = await fetchPost(slug)
        if (blogPost) {
          setPost(blogPost)
          setError(null)
        } else {
          setError('Post not found')
        }
      } catch (err) {
        console.error('Failed to load blog post:', err)
        setError('Failed to load blog post. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadBlogPost()
  }, [slug])

  // Show loading state
  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: 'var(--bg-color)',
        }}
      >
        <Navbar />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="var(--primary-color)" />
          <P className="mt-4 text-center">Loading post...</P>
        </View>
        <Footer />
      </View>
    )
  }

  // Show error message
  if (error || !post) {
    return (
      <View
        className="flex-1"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: 'var(--bg-color)',
        }}
      >
        <Navbar />
        <View className="flex-1 items-center justify-center p-4">
          <P className="text-center text-red-500 mb-4">
            {error || 'Post not found'}
          </P>
        </View>
        <Footer />
      </View>
    )
  }

  // If we have the post, render the standard PostScreen with our fetched data
  return <PostScreen post={post} />
}

// Re-export the standard PostScreen
export { PostScreen }
