'use client'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
// Define a simplified HomePageProps type that matches the structure expected by our component
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
import BlogSection from 'app/ui/blog-section'
import CtaBanner from 'app/ui/cta-banner'
import Faq from 'app/ui/faq'
import { Featured } from 'app/ui/featured'
import Footer from 'app/ui/footer'
import { Hero } from 'app/ui/hero'
import { Navbar } from 'app/ui/navbar/Navbar'
import { View } from 'react-native'

export function HomeScreen(props: HomePageProps) {
  const { posts, header, cta, featured, faq } = props
  const insets = useSafeArea()

  return (
    <View
      className={`flex h-full w-full pt-[${insets.top}px] pb-[${insets.bottom}px] bg-[--bg-color]`}
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
