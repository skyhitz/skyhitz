import type { Metadata } from 'next'
import { Config } from 'app/config'
import EditProfileClient from './edit-client'

export const metadata: Metadata = {
  title: 'Skyhitz - Edit Profile',
  description: 'Edit your Skyhitz profile',
  alternates: { canonical: `${Config.APP_URL}/profile/edit` },
  robots: { index: false, follow: false },
}

export default function EditProfilePage() {
  return <EditProfileClient />
}
