import { H2 } from 'app/design/typography'
import { View } from 'react-native'
import Card from 'app/ui/card'
import { Post } from 'app/types'
import { TextLink } from 'solito/link'

export default function BlogSection({ posts }: { posts: Post[] }) {
  return (
    <View className="mx-auto w-full max-w-7xl px-6 pb-24 md:pb-32 lg:px-8">
      <View className="mx-auto w-full">
        <View className="flex flex-row justify-between">
          <H2 className="text-2xl font-bold leading-10 tracking-tight">Blog</H2>
          <TextLink href="/blog" className="text-sm font-semibold">
            See all →
          </TextLink>
        </View>
        <View className="mt-10 flex min-h-fit w-full flex-col gap-4 sm:flex-row lg:gap-8">
          {posts && posts.map((post) => <Card key={post.slug} {...post} />)}
        </View>
      </View>
    </View>
  )
}
