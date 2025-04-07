'use client'
/** @jsxImportSource react */

import { ComponentAuthGuard } from 'app/utils/authGuard'
import CollectionScreen from 'app/features/dashboard/profile/collection'
import { useUserAtomState } from 'app/state/user'

export default function CollectionPage() {
  const { user } = useUserAtomState()

  return (
    <ComponentAuthGuard>
      {user && <CollectionScreen user={user} />}
    </ComponentAuthGuard>
  )
}
