/** @jsxImportSource react */

import { Config } from 'app/config'
import { SignUp } from 'app/features/accounts/sign-up'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skyhitz - Sign Up',
  description: 'Create an account on Skyhitz',
  alternates: {
    canonical: `${Config.APP_URL}/sign-up`,
  },
}

export default SignUp
