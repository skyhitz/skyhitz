'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import CollectionScreen from 'app/features/dashboard/profile/collection'
import { useUserState } from 'app/state/user/hooks'

export default function CollectionPage() {
  const { user } = useUserState()

  return (
    <ComponentAuthGuard>
      {user && <CollectionScreen user={user} />}
    </ComponentAuthGuard>
  )
}
