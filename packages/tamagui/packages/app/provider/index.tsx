'use client'
import { SafeArea } from 'app/provider/safe-area'
import { SolitoImageProvider } from 'solito/image'
import { ToastProvider } from './toast'
import { AuthProvider } from './auth'
import { GraphQLProvider } from './apollo'
import TopUpRequiredModal from 'app/ui/topup/TopUpRequiredModal'
import { TamaguiProvider } from '@tamagui/core'
import { config } from '@my/config'

interface Props {
  children: React.ReactNode
}

export function Provider({ children }: Props) {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <GraphQLProvider>
        <SafeArea>
          <AuthProvider>
            <ToastProvider>
              <SolitoImageProvider nextJsURL="https://skyhitz.io">
                {children}
                <TopUpRequiredModal />
              </SolitoImageProvider>
            </ToastProvider>
          </AuthProvider>
        </SafeArea>
      </GraphQLProvider>
    </TamaguiProvider>
  )
}
