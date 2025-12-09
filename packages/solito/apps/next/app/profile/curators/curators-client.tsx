'use client'

import { ComponentAuthGuard } from 'app/utils/authGuard'
import CuratorsScreen from 'app/features/profile/curators'

export default function CuratorsClient() {
  return (
    <ComponentAuthGuard>
      <CuratorsScreen />
    </ComponentAuthGuard>
  )
}

