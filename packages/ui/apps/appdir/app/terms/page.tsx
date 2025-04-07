/** @jsxImportSource react */

import { Config } from 'app/config'
import TermsScreen from 'app/features/legal/termsScreen'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skyhitz - Terms of Use',
  description: 'Terms of Use',
  alternates: {
    canonical: `${Config.APP_URL}/terms`,
  },
}

export default function TermsPage() {
  return <TermsScreen />
}
