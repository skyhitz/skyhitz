import { SearchScreen } from 'app/features/search'
import { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - Search music NFTs',
  description: 'Search for the best music NFTs',
  alternates: {
    canonical: `${Config.APP_URL}/search`,
  },
}

export default function SearchPage() {
  return <SearchScreen />
}
