'use client'
import { Config } from 'app/config'
import PrivacyScreen from 'app/features/legal/privacyScreen'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skyhitz - Privacy',
  description: 'Privacy Policy',
  alternates: {
    canonical: `${Config.APP_URL}/privacy`,
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return <PrivacyScreen />
}
