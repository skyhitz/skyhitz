'use client'
/** @jsxImportSource react */

import { ProfileScreen } from 'app/features/dashboard/profile'
import { useUserAtomState } from 'app/state/user'
import { ComponentAuthGuard } from 'app/utils/authGuard'

export default function ProfilePage() {
  const { user } = useUserAtomState()

  return (
    <ComponentAuthGuard>
      {user && <ProfileScreen user={user} />}
    </ComponentAuthGuard>
  )
}
