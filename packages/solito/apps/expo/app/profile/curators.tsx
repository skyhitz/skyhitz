import CuratorsScreen from 'app/features/profile/curators'
import { ComponentAuthGuard } from 'app/features/auth/authGuard'

export default function CuratorsRoute() {
  return <ComponentAuthGuard component={<CuratorsScreen />} />
}

