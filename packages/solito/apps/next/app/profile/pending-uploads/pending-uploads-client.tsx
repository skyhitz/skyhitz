'use client'

import { ComponentAuthGuard } from 'app/utils/authGuard'
import PendingUploadsScreen from 'app/features/profile/pending-uploads'

export default function PendingUploadsClient() {
  return (
    <ComponentAuthGuard>
      <PendingUploadsScreen />
    </ComponentAuthGuard>
  )
}

