'use client'
import { SafeArea } from 'app/provider/safe-area'
import { SolitoImageProvider } from 'solito/image'
import { ToastProvider } from './toast'
import { AuthProvider } from './auth'
import { GraphQLProvider } from './apollo'

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
            </SolitoImageProvider>
          </ToastProvider>
        </AuthProvider>
      </SafeArea>
    </GraphQLProvider>
  )
}
