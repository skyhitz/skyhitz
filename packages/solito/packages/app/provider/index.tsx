'use client'
import { SafeArea } from 'app/provider/safe-area'
import { SolitoImageProvider } from 'solito/image'
import { ToastProvider } from './toast'
import { AuthProvider } from './auth'
import { GraphQLProvider } from './apollo'
import dynamic from 'next/dynamic'
import { lazy, Suspense } from 'react'

// Lazy load modal and player components - they're not needed for initial render
const TopUpRequiredModal = dynamic(
  () => import('app/ui/topup/TopUpRequiredModal'),
  { ssr: false }
)

const PersistentPlayer = dynamic(
  () => import('app/ui/player/PersistentPlayer').then(m => ({ default: m.PersistentPlayer })),
  { ssr: false }
)

const FloatingMiniPlayer = dynamic(
  () => import('app/ui/player/FloatingMiniPlayer').then(m => ({ default: m.FloatingMiniPlayer })),
  { ssr: false }
)

interface Props {
  children: React.ReactNode
}

export function Provider({ children }: Props) {
  return (
    <GraphQLProvider>
      <SafeArea>
        <AuthProvider>
          <ToastProvider>
            <SolitoImageProvider nextJsURL="https://skyhitz.io">
              {children}
              {/* Load player and modal components after main content */}
              <TopUpRequiredModal />
              <PersistentPlayer />
              <FloatingMiniPlayer />
            </SolitoImageProvider>
          </ToastProvider>
        </AuthProvider>
      </SafeArea>
    </GraphQLProvider>
  )
}
