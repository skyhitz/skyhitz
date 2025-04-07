/** @jsxImportSource react */

'use client'
import { H1 } from 'app/design/typography'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import CtaBanner from 'app/ui/cta-banner'
import Footer from 'app/ui/footer'
import Navbar from 'app/ui/navbar'
import { View } from 'react-native'

export default function NotFound() {
  const insets = useSafeArea()

  return (
    <View
      className={`h-[calc(100dvh)] w-full pt-[${insets.top}px] pb-[${insets.bottom}px]`}
    >
      <Navbar />
      <View className="mb-16 flex w-full grow">
        <H1 className="mx-auto w-full max-w-7xl py-8 text-center">
          Couldn&apos;t find what you are looking for?
        </H1>
        <CtaBanner
          subtitle="404"
          title="Explore valuable music NFTs"
          desc="Check out our chart or go to our search page to find what you are looking for 🔍"
          cta="Go to Chart!"
        />
      </View>
      <Footer />
    </View>
  )
}
