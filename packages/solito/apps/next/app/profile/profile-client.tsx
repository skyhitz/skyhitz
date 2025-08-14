'use client'

import { ProfileScreen } from 'app/features/profile'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { useUserState } from 'app/state/user/hooks'

export default function ProfileClient() {
  const { user } = useUserState()
  return (
    <ComponentAuthGuard>
      {user && <ProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}


