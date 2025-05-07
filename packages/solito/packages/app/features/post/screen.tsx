'use client'
import { H1, P } from 'app/design/typography'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
// Use a more generic any type since the Post type appears to be missing or changed
// TODO: Update to a proper Post type when API is finalized
type Post = any
import Footer from 'app/ui/footer'
import { Navbar } from 'app/ui/navbar/Navbar'
import { formattedDate } from 'app/utils'
import { View } from 'react-native'
import HTMLView from 'react-native-htmlview'
import { SolitoImage } from 'app/design/solito-image'
import * as React from 'react'
import { useTheme } from 'app/state/theme/useTheme'

// Fix TypeScript type issue with HTMLView
const TypeSafeHTMLView = HTMLView as React.ComponentType<any>

export function PostScreen({ post }: { post: any }) {
  const insets = useSafeArea()
  const { theme } = useTheme()

  const { title, imageUrl, content, publishedAtTimestamp } = post

  return (
    <View
      className="flex h-full w-full"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: 'var(--bg-color)',
      }}
    >
      <Navbar />
      <View className="mx-auto mb-32 w-full max-w-4xl px-6 lg:px-8">
        <H1 className="mb-4 mt-10 text-4xl lg:text-6xl text-[--text-color]">{title}</H1>
        <P className="mt-4 text-left text-[--secondary-color]">{formattedDate(publishedAtTimestamp)}</P>
        <View style={{ borderBottomWidth: 1, borderBottomColor: 'var(--border-color)', marginVertical: 32 }} />

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
          <TypeSafeHTMLView 
            value={content} 
            stylesheet={{
              p: { color: 'var(--text-color)', marginBottom: 16 },
              h1: { color: 'var(--text-color)', fontWeight: 'bold', fontSize: 24, marginVertical: 16 },
              h2: { color: 'var(--text-color)', fontWeight: 'bold', fontSize: 20, marginVertical: 14 },
              h3: { color: 'var(--text-color)', fontWeight: 'bold', fontSize: 18, marginVertical: 12 },
              a: { color: 'var(--primary-color)' },
              li: { color: 'var(--text-color)', marginBottom: 8 },
              ul: { marginBottom: 16, paddingLeft: 20 },
              ol: { marginBottom: 16, paddingLeft: 20 }
            }}
          />
        </View>
      </View>
      <Footer />
    </View>
  )
}
