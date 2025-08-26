import { SignInWithTokenClient } from './sign-in-with-token-client'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const dynamic = 'force-dynamic'

export default function SignInWithTokenPage() {
  return <SignInWithTokenClient />
}

export const metadata: Metadata = {
  title: 'Skyhitz - Sign In With Token',
  description: 'Sign in to your Skyhitz account using a magic link token',
  alternates: {
    canonical: `${Config.APP_URL}/sign-in-with-token`,
  },
  robots: { index: false, follow: false },
}
