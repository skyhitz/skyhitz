'use client'

import { ComponentAuthGuard } from 'app/utils/authGuard'
import EditProfileScreen from 'app/features/profile/edit'
import { useUserState } from 'app/state/user/hooks'

export default function EditProfileClient() {
  const { user } = useUserState()
  return (
    <ComponentAuthGuard>
      {user && <EditProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}


