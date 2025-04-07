/** @jsxImportSource react */

import { Config } from 'app/config'
import { SignIn } from 'app/features/accounts/sign-in'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skyhitz - Sign In',
  description: 'Authenticate to Skyhitz',
  alternates: {
    canonical: `${Config.APP_URL}/sign-in`,
  },
}

export default SignIn
