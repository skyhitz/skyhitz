import type { Metadata } from 'next'
import { Config } from 'app/config'
import PendingUploadsClient from './pending-uploads-client'

export const metadata: Metadata = {
  title: 'Skyhitz - Pending Uploads',
  description: 'Review and approve pending music uploads',
  alternates: { canonical: `${Config.APP_URL}/profile/pending-uploads` },
  robots: { index: false, follow: false },
}

export default function PendingUploadsPage() {
  return <PendingUploadsClient />
}

