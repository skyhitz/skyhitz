'use client'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import LikesScreen from 'app/features/dashboard/profile/likes'
import { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  title: 'Skyhitz - Your Likes',
  description: 'View your liked beats on Skyhitz',
  alternates: {
    canonical: `${Config.APP_URL}/dashboard/profile/likes`,
  },
}

export default function LikesPage() {
  return (
    <ComponentAuthGuard>
      <LikesScreen />
    </ComponentAuthGuard>
  )
}
