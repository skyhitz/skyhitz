import ProfileClient from './profile-client'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - My Profile',
  description: 'Manage your Skyhitz profile',
  alternates: { canonical: `${Config.APP_URL}/profile` },
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  return <ProfileClient />
}
