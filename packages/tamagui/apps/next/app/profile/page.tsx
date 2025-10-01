'use client'
import { ProfileScreen } from 'app/features/profile'
import { useUserState } from 'app/state/user/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { user } = useUserState()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  if (!user) return null

  return <ProfileScreen user={user} />
}

