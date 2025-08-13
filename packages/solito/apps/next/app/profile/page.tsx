'use client'
import { ProfileScreen } from 'app/features/profile'
import { useUserState } from 'app/state/user/hooks'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - My Profile',
  description: 'Manage your Skyhitz profile',
  alternates: { canonical: `${Config.APP_URL}/profile` },
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  const { user } = useUserState()

  return (
    <ComponentAuthGuard>
      {user && <ProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
