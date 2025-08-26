import CollectionClient from './collection-client'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - My Collection',
  description: 'View your collected music NFTs',
  alternates: { canonical: `${Config.APP_URL}/profile/collection` },
  robots: { index: false, follow: false },
}

export default function CollectionPage() {
  return <CollectionClient />
}
