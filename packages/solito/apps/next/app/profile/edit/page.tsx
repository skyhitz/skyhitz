'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import EditProfileScreen from 'app/features/profile/edit'
import { useUserState } from 'app/state/user/hooks'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - Edit Profile',
  description: 'Edit your Skyhitz profile',
  alternates: { canonical: `${Config.APP_URL}/profile/edit` },
  robots: { index: false, follow: false },
}

export default function EditProfilePage() {
  const { user } = useUserState()

  return (
    <ComponentAuthGuard>
      {user && <EditProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
