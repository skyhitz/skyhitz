import { ComponentAuthGuard } from 'app/utils/authGuard'
import CuratorsScreen from 'app/features/profile/curators'

export default function CuratorsRoute() {
  return (
    <ComponentAuthGuard>
      <CuratorsScreen />
    </ComponentAuthGuard>
  )
}

