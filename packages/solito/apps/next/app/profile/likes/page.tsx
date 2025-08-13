'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import LikesScreen from 'app/features/profile/likes'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - My Likes',
  description: 'View music you have liked on Skyhitz',
  alternates: { canonical: `${Config.APP_URL}/profile/likes` },
  robots: { index: false, follow: false },
}

export default function LikesPage() {
  return (
    <ComponentAuthGuard>
      <LikesScreen />
    </ComponentAuthGuard>
  )
}
