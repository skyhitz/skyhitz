'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import LikesScreen from 'app/features/profile/likes'

export default function LikesPage() {
  return (
    <ComponentAuthGuard>
      <LikesScreen />
    </ComponentAuthGuard>
  )
}
