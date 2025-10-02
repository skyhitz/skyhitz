'use client'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import BlogSection from 'app/ui/blog-section'
import CtaBanner from 'app/ui/cta-banner'
import Faq from 'app/ui/faq'
import { Featured } from 'app/ui/featured'
import { Hero } from 'app/ui/hero'
import { ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { JSX } from 'react'
import { Post } from 'app/types/index'

type HomePageProps = {
  posts: Post[]
  header: {
    title: string
    desc: string
  }
  cta: {
    title: string
    subtitle: string
    desc: string
    cta: string
  }
  featured: {
    title: string
    subtitle: string
    features: Array<{
      name: string
      desc: string
      icon: (props: any) => JSX.Element
    }>
    imgUrl: string
  }
  faq: {
    title: string
    faqs: Array<{
      question: string
      answer: string
    }>
  }
  // Optional landing property that might be passed by the Next.js page component
  landing?: boolean
}

export function HomeScreen(props: HomePageProps) {
  const { posts, header, cta, featured, faq } = props
  const insets = useSafeArea()

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      <ScrollView style={{ flex: 1, width: '100%' }}>
        {header && <Hero {...header} />}
        {cta && <CtaBanner {...cta} />}
        {featured && <Featured {...featured} />}
        {faq && <Faq {...faq} />}
        {posts && <BlogSection posts={posts} />}
      </ScrollView>
    </YStack>
  )
}