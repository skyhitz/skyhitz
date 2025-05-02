'use client'
import { ProfileScreen } from 'app/features/dashboard/profile'
import { useUserState } from 'app/state/user/hooks'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - Profile',
  description: 'Your Skyhitz profile page',
  alternates: {
    canonical: `${Config.APP_URL}/dashboard/profile`,
  },
}

export default function ProfilePage() {
  const { user } = useUserState()

  return (
    <ComponentAuthGuard>
      {user && <ProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
