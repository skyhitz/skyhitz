'use client'
import { A, H1, P } from 'app/design/typography'
import { View } from 'react-native'
import { SolitoImage } from 'app/design/solito-image'
import { Link } from 'solito/link'
import { useUserState } from 'app/state/user/hooks'
import { useEffect } from 'react'
import { useRouter } from 'solito/navigation'

export interface HeroProps {
  title: string
  desc: string
}

export const Hero = ({ title, desc }: HeroProps) => {
  const { user } = useUserState()
  const router = useRouter()
  
  // Prefetch critical routes for faster navigation
  useEffect(() => {
    // Prefetch the most likely next destinations
    router.prefetch('/chart')
    router.prefetch('/sign-up')
    router.prefetch('/sign-in')
  }, [router])

  return (
    <View className="mx-auto max-w-7xl px-6 pt-8 flex flex-col w-full md:flex-row lg:gap-x-10 lg:px-8">
      <View className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto flex-1 min-h-fit">
        <H1 className="mt-10 max-w-lg text-4xl font-bold !leading-tight tracking-tight sm:text-5xl">
          {title}
        </H1>
        <P className="mt-6 leading-8 text-[--text-secondary-color]">{desc}</P>
        <View className="mt-10 flex flex-row items-center gap-x-6">
          <View className="bg-blue rounded-lg px-3 py-2">
            <Link href={user ? '/chart' : '/sign-up'}>
              <P className="tracking-0.5 p-2 text-sm font-bold text-white">
                Get started
              </P>
            </Link>
          </View>
          <A
            href="#mission"
            className="text-sm text-[--text-color] font-semibold leading-6"
          >
            Learn more →
          </A>
        </View>
      </View>
      <View className="my-8 md:my-0 flex-1 min-h-[610px] relative">
        <SolitoImage
          src="/img/app.webp"
          alt="Skyhitz app"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          contentFit="contain"
          className="object-contain w-full h-full"
          priority
        />
      </View>
    </View>
  )
}
