import { Metadata } from 'next'
import { Config } from 'app/config'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { SpendScreen } from 'app/features/profile/spend'

export const metadata: Metadata = {
  title: 'Skyhitz - Spend',
  description: 'Issue a virtual card and spend your XLM balance',
  alternates: { canonical: `${Config.APP_URL}/profile/spend` },
  robots: { index: false, follow: false },
}

export default function SpendPage() {
  return (
    <ComponentAuthGuard>
      <SpendScreen />
    </ComponentAuthGuard>
  )
}


