import * as React from 'react'
import { PostScreen } from './screen'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { View, ActivityIndicator } from 'react-native'
import { P } from 'app/design/typography'
import { Navbar } from 'app/ui/navbar/Navbar'
import Footer from 'app/ui/footer'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'

// Define Post type locally
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

// Function to fetch a specific blog post by slug
async function fetchBlogPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await algoliaClient.searchSingleIndex({
      indexName: indexNames.blog,
      searchParams: {
        query: '',
        filters: `objectID:${slug}`, // Use objectID instead of slug to match web implementation
        hitsPerPage: 1,
      },
    })

    if (response.hits && response.hits.length > 0) {
      return response.hits[0] as unknown as Post
    }

    // Fallback to searching by slug if objectID doesn't work
    const slugResponse = await algoliaClient.searchSingleIndex({
      indexName: indexNames.blog,
      searchParams: {
        query: '',
        filters: `slug:${slug}`,
        hitsPerPage: 1,
      },
    })

    if (slugResponse.hits && slugResponse.hits.length > 0) {
      return slugResponse.hits[0] as unknown as Post
    }

    return null
  } catch (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error)
    return null
  }
}

// Native-specific post screen wrapper that handles data loading
export function PostScreenNative({ route }: any) {
  // Get the slug from route params if available
  // This handles how React Navigation passes params
  const slug = route?.params?.slug
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
        const blogPost = await fetchBlogPostBySlug(slug)
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
