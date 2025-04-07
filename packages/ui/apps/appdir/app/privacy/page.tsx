/** @jsxImportSource react */

import { Config } from 'app/config'
import PrivacyScreen from 'app/features/legal/privacyScreen'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skyhitz - Privacy',
  description: 'Privacy Policy',
  alternates: {
    canonical: `${Config.APP_URL}/privacy`,
  },
}

export default function PrivacyPage() {
  return <PrivacyScreen />
}
