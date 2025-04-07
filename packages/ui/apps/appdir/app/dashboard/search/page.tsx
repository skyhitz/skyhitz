/** @jsxImportSource react */

import { SearchScreen } from 'app/features/dashboard/search'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skyhitz - Search music NFTs',
  description: 'Search for the best music NFTs',
  alternates: {
    canonical: `https://skyhitz.io/dashboard/search`,
  },
}

export default function SearchPage() {
  return <SearchScreen />
}
