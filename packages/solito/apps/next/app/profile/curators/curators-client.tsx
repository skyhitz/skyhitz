'use client'
import CuratorsScreen from 'app/features/profile/curators'
import { ComponentAuthGuard } from 'app/features/auth/authGuard'

export default function CuratorsClient() {
  return <ComponentAuthGuard component={<CuratorsScreen />} />
}

