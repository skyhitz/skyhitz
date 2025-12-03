'use client'
import { SafeArea } from 'app/provider/safe-area'
import { SolitoImageProvider } from 'solito/image'
import { ToastProvider } from './toast'
import { AuthProvider } from './auth'
import { GraphQLProvider } from './apollo'
import TopUpRequiredModal from 'app/ui/topup/TopUpRequiredModal'
import { PersistentPlayer } from 'app/ui/player/PersistentPlayer'
import { FloatingMiniPlayer } from 'app/ui/player/FloatingMiniPlayer'

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
