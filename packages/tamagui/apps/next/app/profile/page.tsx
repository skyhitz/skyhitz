'use client'
import { ProfileScreen } from 'app/features/profile'
import { useUserState } from 'app/state/user/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navbar, Footer } from 'app'
import { YStack } from 'tamagui'

export default function ProfilePage() {
  const { user } = useUserState()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  if (!user) return null

  return (
    <YStack flex={1} backgroundColor="$background">
      <Navbar />
      <ProfileScreen user={user} />
      <Footer />
    </YStack>
  )
}

