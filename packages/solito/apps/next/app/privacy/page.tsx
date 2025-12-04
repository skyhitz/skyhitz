import { Config } from 'app/config'
import PrivacyScreen from 'app/features/legal/privacyScreen'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Skyhitz',
  description:
    'Read the Skyhitz Privacy Policy. Learn how we collect, use, and protect your personal information on our music NFT marketplace.',
  alternates: {
    canonical: `${Config.APP_URL}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | Skyhitz',
    description: 'Privacy Policy for the Skyhitz music NFT marketplace.',
    url: `${Config.APP_URL}/privacy`,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return <PrivacyScreen />
}
