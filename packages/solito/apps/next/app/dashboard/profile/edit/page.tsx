'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import EditProfileScreen from 'app/features/dashboard/profile/edit'
import { useUserState } from 'app/state/user/hooks'
import { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - Edit Profile',
  description: 'Edit your Skyhitz profile information',
  alternates: {
    canonical: `${Config.APP_URL}/dashboard/profile/edit`,
  },
}

export default function EditProfilePage() {
  const { user } = useUserState()
  
  return (
    <ComponentAuthGuard>
      {user && <EditProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
