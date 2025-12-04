'use client'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { Hero } from 'app/ui/hero'
import { Navbar } from 'app/ui/navbar/Navbar'
import { ScrollView, View } from 'react-native'
import { JSX, lazy, Suspense, memo, useState, useEffect } from 'react'
import { Post } from 'app/types/index'

// Lazy load below-the-fold components for faster initial render
const CtaBanner = lazy(() => import('app/ui/cta-banner'))
const Featured = lazy(() => import('app/ui/featured').then(m => ({ default: m.Featured })))
const Faq = lazy(() => import('app/ui/faq'))
const BlogSection = lazy(() => import('app/ui/blog-section'))
const Footer = lazy(() => import('app/ui/footer'))

// Minimal skeleton placeholder for lazy components
const LazyPlaceholder = () => (
  <View className="w-full min-h-[200px] bg-[--bg-color]" />
)

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

// Memoize child components to prevent unnecessary re-renders
const MemoizedHero = memo(Hero)

export function HomeScreen(props: HomePageProps) {
  const { posts, header, cta, featured, faq } = props
  const insets = useSafeArea()
  
  // Delay loading non-critical sections until after initial render
  const [showBelowFold, setShowBelowFold] = useState(false)
  
  useEffect(() => {
    // Use requestIdleCallback to load below-fold content when browser is idle
    const loadBelowFold = () => setShowBelowFold(true)
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadBelowFold, { timeout: 500 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadBelowFold, 100)
    }
  }, [])

  return (
    <View
      className="flex-1 bg-[--bg-color]"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Navbar />
      <ScrollView className="flex-1 w-full">
        {/* Above-the-fold: Load immediately */}
        {header && <MemoizedHero {...header} />}
        
        {/* Below-the-fold: Lazy load for faster initial paint */}
        {showBelowFold && (
          <Suspense fallback={<LazyPlaceholder />}>
            {cta && <CtaBanner {...cta} />}
          </Suspense>
        )}
        {showBelowFold && (
          <Suspense fallback={<LazyPlaceholder />}>
            {featured && <Featured {...featured} />}
          </Suspense>
        )}
        {showBelowFold && (
          <Suspense fallback={<LazyPlaceholder />}>
            {faq && <Faq {...faq} />}
          </Suspense>
        )}
        {showBelowFold && (
          <Suspense fallback={<LazyPlaceholder />}>
            {posts && <BlogSection posts={posts} />}
          </Suspense>
        )}
        {showBelowFold && (
          <Suspense fallback={<LazyPlaceholder />}>
            <Footer />
          </Suspense>
        )}
      </ScrollView>
    </View>
  )
}