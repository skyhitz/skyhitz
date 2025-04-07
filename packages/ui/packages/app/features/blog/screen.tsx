'use client'

import { A, Button, H1, H2, P, ActivityIndicator } from 'app/design/typography'
import { useBlogPosts } from 'app/hooks/algolia/useBlogPosts'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { Post } from 'app/types'
import Footer from 'app/ui/footer'
import Navbar from 'app/ui/navbar'
import { View } from 'react-native'
import { SolitoImage } from 'app/design/solito-image'
import { formattedDate } from 'app/utils'

const PostWrapper = ({ imageUrl, title, publishedAtTimestamp, slug }: Post) => {
  return (
    <A href={`/blog/${slug}`}>
      <View className="flex flex-row items-center justify-start gap-8">
        <View className="aspect-[2/2] w-32 object-cover">
          <SolitoImage
            src={imageUrl}
            alt={title}
            contentFit="cover"
            fill
            style={{ borderRadius: 12 }}
          />
        </View>
        <View className="flex shrink flex-col items-start justify-center">
          <H2 className="mb-2 break-words text-xl text-black">{title}</H2>
          <P>{formattedDate(publishedAtTimestamp)}</P>
        </View>
      </View>
    </A>
  )
}

export function BlogScreen({ posts }: { posts: Post[] }) {
  const insets = useSafeArea()
  const {
    data: extraPosts,
    isLoadingMore,
    onNextPage,
    loadMoreEnabled,
  } = useBlogPosts(1)

  return (
    <View
      className={`flex h-full w-full pt-[${insets.top}px] pb-[${insets.bottom}px]`}
    >
      <Navbar />
      <View className="mx-auto mb-32 w-full max-w-7xl px-6 lg:px-8">
        <H1 className="mb-4 mt-10 text-4xl">Blog</H1>
        <View className="my-8 border-b border-gray-200" />
        <View className="gap-16">
          {posts.map((props, index) => {
            return <PostWrapper key={index} {...props} />
          })}

          {extraPosts.map((props, index) => {
            return <PostWrapper key={index} {...props} />
          })}
        </View>
        <View className="mt-16 flex h-12 items-center justify-center">
          {isLoadingMore ? (
            <ActivityIndicator size={'small'} />
          ) : (
            loadMoreEnabled && (
              <Button
                onPress={() => {
                  onNextPage()
                }}
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
