'use client'
import { ProfileScreen } from 'app/features/profile'
import { useUserState } from 'app/state/user/hooks'
import { ComponentAuthGuard } from 'app/utils/authGuard'

export default function ProfilePage() {
  const { user } = useUserState()

  return (
    <ComponentAuthGuard>
      {user && <ProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
