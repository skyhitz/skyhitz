import { H2, A } from 'app/design/typography'
import Card from 'app/ui/card'
import { TextLink } from 'app/navigation'
import { YStack, XStack } from 'tamagui'

export default function BlogSection({ posts = [] }: { posts?: any[] }) {
  return (
    <YStack
      marginHorizontal="auto"
      width="100%"
      maxWidth="$7xl"
      paddingHorizontal="$6"
      paddingBottom="$24"
      md={{ paddingBottom: '$32' }}
      lg={{ paddingHorizontal: '$8' }}
    >
      <YStack marginHorizontal="auto" width="100%">
        <XStack flexDirection="row" justifyContent="space-between">
          <H2
            fontSize="$7"
            fontWeight="bold"
            lineHeight="$10"
            letterSpacing="$-1"
          >
            Blog
          </H2>
          <TextLink href="/blog">
            <A
              fontSize="$3"
              fontWeight="600"
              color="$blue9"
            >
              See all →
            </A>
          </TextLink>
        </XStack>
        <XStack
          marginTop="$10"
          minHeight="fit-content"
          width="100%"
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap="$4"
          lg={{ gap: '$8' }}
        >
          {posts && posts.map((post) => <Card key={post.slug} {...post} />)}
        </XStack>
      </YStack>
    </YStack>
  )
}
