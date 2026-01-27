import { Config } from 'app/config'
import TermsScreen from 'app/features/legal/termsScreen'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Skyhitz',
  description:
    'Read the Skyhitz Terms of Service. Learn about the rules and guidelines for using our music NFT marketplace on the Stellar blockchain.',
  alternates: {
    canonical: `${Config.APP_URL}/terms`,
  },
  openGraph: {
    title: 'Terms of Service | Skyhitz',
    description: 'Terms of Service for the Skyhitz music NFT marketplace.',
    url: `${Config.APP_URL}/terms`,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return <TermsScreen />
}
