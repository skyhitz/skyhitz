import { ComponentAuthGuard } from 'app/utils/authGuard'
import PendingUploadsScreen from 'app/features/profile/pending-uploads'

export default function PendingUploadsPage() {
  return (
    <ComponentAuthGuard>
      <PendingUploadsScreen />
    </ComponentAuthGuard>
  )
}

