'use client'

import { ComponentAuthGuard } from 'app/utils/authGuard'
import LikesScreen from 'app/features/profile/likes'

export default function LikesClient() {
  return (
    <ComponentAuthGuard>
      <LikesScreen />
    </ComponentAuthGuard>
  )
}


