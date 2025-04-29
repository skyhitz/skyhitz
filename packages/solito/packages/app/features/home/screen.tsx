'use client'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { HomePageProps } from 'app/types'
import BlogSection from 'app/ui/blog-section'
import CtaBanner from 'app/ui/cta-banner'
import Faq from 'app/ui/faq'
import { Featured } from 'app/ui/featured'
import Footer from 'app/ui/footer'
import { Hero } from 'app/ui/hero'
import Navbar from 'app/ui/navbar'
import { View } from 'react-native'

export function HomeScreen(props: HomePageProps) {
  const { posts, header, cta, featured, faq } = props
  const insets = useSafeArea()

  return (
    <View
      className={`flex h-full w-full pt-[${insets.top}px] pb-[${insets.bottom}px]`}
    >
      <Navbar />
      <Hero {...header} />
      <CtaBanner {...cta} />
      <Featured {...featured} />
      <Faq {...faq} />
      <BlogSection posts={posts} />
      <Footer />
    </View>
  )
}
