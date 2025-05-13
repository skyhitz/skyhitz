import { Metadata } from 'next'
import { Config } from 'app/config'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { TopUpScreen } from 'app/features/topup/screen'

export const metadata: Metadata = {
  title: 'Skyhitz - Top Up',
  description: 'Add XLM to your Skyhitz account',
  alternates: {
    canonical: `${Config.APP_URL}/top-up`,
  },
}

export default function TopUpPage() {
  return (
    <ComponentAuthGuard>
      <TopUpScreen />
    </ComponentAuthGuard>
  )
}
