'use client'
import { H1, P } from 'app/design/typography'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { Post } from 'app/types'
import Footer from 'app/ui/footer'
import Navbar from 'app/ui/navbar'
import { formattedDate } from 'app/utils'
import { View } from 'react-native'
import HTMLView from 'react-native-htmlview'
import { SolitoImage } from 'app/design/solito-image'
import * as React from 'react'

// Fix TypeScript type issue with HTMLView
const TypeSafeHTMLView = HTMLView as React.ComponentType<any>

export function PostScreen({ post }: { post: Post }) {
  const insets = useSafeArea()

  const { title, imageUrl, content, publishedAtTimestamp } = post

  return (
    <View
      className="flex h-full w-full"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Navbar />
      <View className="mx-auto mb-32 w-full max-w-4xl px-6 lg:px-8">
        <H1 className="mb-4 mt-10 text-4xl lg:text-6xl">{title}</H1>
        <P className="mt-4 text-left">{formattedDate(publishedAtTimestamp)}</P>
        <View className="my-8 border-b border-gray-200" />

        <View className="aspect-[3/2] w-full object-cover">
          <View className="relative h-full w-full overflow-hidden rounded-2xl">
            <SolitoImage
              src={imageUrl}
              alt={title || 'Blog post image'}
              fill
              contentFit="cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </View>
        </View>
        <View className="blog mt-12 gap-8">
          <TypeSafeHTMLView value={content} />
        </View>
      </View>
      <Footer />
    </View>
  )
}
