import { UploadScreen } from 'app/features/upload/screen'
import { ComponentAuthGuard } from 'app/utils/authGuard'

export default function UploadScreenPage() {
  return (
    <ComponentAuthGuard>
      <UploadScreen />
    </ComponentAuthGuard>
  )
}

