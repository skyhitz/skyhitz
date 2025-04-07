/** @jsxImportSource react */

import { ComponentAuthGuard } from 'app/utils/authGuard'
import LikesScreen from 'app/features/dashboard/profile/likes'

export default function LikesPage() {
  return (
    <ComponentAuthGuard>
      <LikesScreen />
    </ComponentAuthGuard>
  )
}
