'use client'

import { A, Button, H1, H2, P, ActivityIndicator } from 'app/design/typography'
import { useBlogPosts } from 'app/hooks/algolia/useBlogPosts'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
// Define a local Post type since it might have changed in the main types file
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
import Footer from 'app/ui/footer'
import { Navbar } from 'app/ui/navbar/Navbar'
import { View } from 'react-native'
import { SolitoImage } from 'app/design/solito-image'
import { formattedDate } from 'app/utils'
import { useTheme } from 'app/state/theme/useTheme'

const PostWrapper = ({ imageUrl, title, publishedAtTimestamp, slug }: Post) => {
  const { theme } = useTheme()
  return (
    <A href={`/blog/${slug}`}>
      <View className="flex flex-row items-center justify-start gap-8">
        <View className="aspect-[2/2] w-32 object-cover">
          <View className="relative h-full w-full overflow-hidden rounded-2xl">
            <SolitoImage
              src={imageUrl}
              alt={title}
              contentFit="cover"
              fill
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </View>
        <View className="flex shrink flex-col items-start justify-center">
          <H2 className="mb-2 break-words text-xl text-[--text-color]">{title}</H2>
          <P className="text-[--secondary-color]">{formattedDate(publishedAtTimestamp)}</P>
        </View>
      </View>
    </A>
  )
}

export function BlogScreen({ posts = [] }: { posts?: any[] }) {
  const insets = useSafeArea()
  const { theme } = useTheme()
  const {
    data: extraPosts = [],
    isLoadingMore = false,
    onNextPage = () => {},
    loadMoreEnabled = false,
  } = useBlogPosts(1) || {}

  return (
    <View
      className={`flex h-full w-full`}
      style={{ 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: 'var(--bg-color)',
      }}
    >
      <Navbar />
      <View className="mx-auto mb-32 w-full max-w-7xl px-6 lg:px-8">
        <H1 className="mb-4 mt-10 text-4xl text-[--text-color]">Blog</H1>
        <View style={{ borderBottomWidth: 1, borderBottomColor: 'var(--border-color)', marginVertical: 32 }} />
        <View className="gap-16">
          {posts && posts.length > 0 ? (
            posts.map((props, index) => (
              <PostWrapper key={`post-${index}`} {...props} />
            ))
          ) : null}

          {extraPosts && extraPosts.length > 0 ? (
            extraPosts.map((props, index) => (
              <PostWrapper key={`extra-${index}`} {...props} />
            ))
          ) : null}

          {(!posts || posts.length === 0) && (!extraPosts || extraPosts.length === 0) && (
            <View className="py-12 items-center">
              <P className="text-[--secondary-color]">Loading blog posts...</P>
            </View>
          )}
        </View>
        <View className="mt-16 flex h-12 items-center justify-center">
          {isLoadingMore ? (
            <ActivityIndicator size={'small'} color="var(--primary-color)" />
          ) : (
            loadMoreEnabled && (
              <Button
                onPress={() => {
                  onNextPage()
                }}
                className="text-[--primary-color]"
              >
                Load More →
              </Button>
            )
          )}
        </View>
      </View>
      <Footer />
    </View>
  )
}
