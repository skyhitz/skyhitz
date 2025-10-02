'use client'

import { A, H1, H2, P, ActivityIndicator } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useBlogPosts } from 'app/hooks/algolia/useBlogPosts'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import Footer from 'app/ui/footer'
import { Navbar } from 'app/ui/navbar/Navbar'
import { YStack, XStack } from 'tamagui'
import { SolitoImage } from 'app/design/solito-image'
import { formattedDate } from 'app/utils'
import { Post } from 'app/types/index'
import { imageSrc } from 'app/utils/entry'

const PostWrapper = ({ imageUrl, title, publishedAtTimestamp, slug }: Post) => {
  return (
    <A href={`/blog/${slug}`}>
      <XStack flexDirection="row" alignItems="center" justifyContent="flex-start" gap="$8">
        <YStack aspectRatio={1} width={128}>
          <YStack position="relative" height="100%" width="100%" overflow="hidden" borderRadius="$4">
            <SolitoImage
              src={imageSrc(imageUrl)}
              alt={title}
              contentFit="cover"
              fill
              style={{ width: '100%', height: '100%' }}
            />
          </YStack>
        </YStack>
        <YStack flexShrink={1} flexDirection="column" alignItems="flex-start" justifyContent="center">
          <H2 marginBottom="$2" fontSize="$5" color="$color">
            {title}
          </H2>
          <P color="$color11">
            {formattedDate(publishedAtTimestamp)}
          </P>
        </YStack>
      </XStack>
    </A>
  )
}

export function BlogScreen({ posts = [] }: { posts?: any[] }) {
  const insets = useSafeArea()
  const {
    data: extraPosts = [],
    isLoadingMore = false,
    onNextPage = () => {},
    loadMoreEnabled = false,
  } = useBlogPosts(0) || {}

  return (
    <YStack
      height="100%"
      width="100%"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      backgroundColor="$background"
    >
      <Navbar />
      <YStack marginHorizontal="auto" marginBottom="$16" width="100%" maxWidth="$7xl" paddingHorizontal="$6" lg={{ paddingHorizontal: '$8' }}>
        <H1 marginBottom="$4" marginTop="$10" fontSize="$9" color="$color">Blog</H1>
        <YStack
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          marginVertical="$8"
        />
        <YStack gap="$16">
          {posts && posts.length > 0
            ? posts.map((props, index) => (
                <PostWrapper key={`post-${index}`} {...props} />
              ))
            : null}

          {extraPosts && extraPosts.length > 0
            ? extraPosts.map((props, index) => (
                <PostWrapper key={`extra-${index}`} {...props} />
              ))
            : null}

          {(!posts || posts.length === 0) &&
            (!extraPosts || extraPosts.length === 0) && (
              <YStack paddingVertical="$12" alignItems="center">
                <P color="$color11">
                  Loading blog posts...
                </P>
              </YStack>
            )}
        </YStack>
        <YStack marginTop="$16" height={48} alignItems="center" justifyContent="center">
          {isLoadingMore ? (
            <ActivityIndicator size={'small'} />
          ) : (
            loadMoreEnabled && (
              <Button
                onPress={() => {
                  onNextPage()
                }}
                color="$blue9"
              >
                Load More →
              </Button>
            )
          )}
        </YStack>
      </YStack>
      <Footer />
    </YStack>
  )
}
