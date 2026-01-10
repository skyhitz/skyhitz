'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { UploadScreen } from 'app/features/upload/screen'

export default function UploadPage() {
  return (
    <ComponentAuthGuard>
      <UploadScreen />
    </ComponentAuthGuard>
  )
}
