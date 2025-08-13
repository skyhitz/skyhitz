'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import CollectionScreen from 'app/features/profile/collection'
import { useUserState } from 'app/state/user/hooks'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - My Collection',
  description: 'View your collected music NFTs',
  alternates: { canonical: `${Config.APP_URL}/profile/collection` },
  robots: { index: false, follow: false },
}

export default function CollectionPage() {
  const { user } = useUserState()

  return (
    <ComponentAuthGuard>
      {user && <CollectionScreen user={user} />}
    </ComponentAuthGuard>
  )
}
