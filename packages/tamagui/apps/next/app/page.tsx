'use client'
import { YStack } from 'tamagui'
import { Hero } from 'app/ui/hero'
import CtaBanner from 'app/ui/cta-banner'
import { Featured } from 'app/ui/featured'
import { Navbar, Footer } from 'app'

// Mock data - in real app this comes from CMS or API
const homePageData = {
  header: {
    title: "Your Music, Your Equity",
    desc: "Discover music and invest in the tracks you love. Stream, mint, and earn with blockchain-powered music on Skyhitz."
  },
  cta: {
    title: "Fair Music Economy",
    subtitle: "OUR MISSION",
    desc: "We believe artists deserve fair compensation and fans should benefit from supporting great music. Skyhitz creates a transparent marketplace where music value flows directly between creators and supporters.",
    cta: "Explore Music"
  },
  featured: {
    title: "Powerful Features",
    subtitle: "EVERYTHING YOU NEED",
    features: [
      {
        name: "Stream & Discover",
        desc: "Explore curated playlists and trending tracks from independent artists.",
        icon: () => null
      },
      {
        name: "Invest in Music",
        desc: "Own equity in the tracks you believe in and earn from their success.",
        icon: () => null
      },
      {
        name: "Creator Tools",
        desc: "Upload, mint, and monetize your music with blockchain technology.",
        icon: () => null
      }
    ],
    imgUrl: "/img/app.webp"
  }
}

export default function HomePage() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <Navbar />
      <Hero {...homePageData.header} />
      <CtaBanner {...homePageData.cta} />
      <Featured {...homePageData.featured} />
      <Footer />
    </YStack>
  )
}
