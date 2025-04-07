'use client'
/** @jsxImportSource react */

import { ComponentAuthGuard } from 'app/utils/authGuard'
import EditProfileScreen from 'app/features/dashboard/profile/edit'
import { useUserAtomState } from 'app/state/user'

export default function EditProfilePage() {
  const { user } = useUserAtomState()
  return (
    <ComponentAuthGuard>
      {user && <EditProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
