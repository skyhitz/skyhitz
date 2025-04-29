'use client'
import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation'
import { SolitoImageProvider } from 'solito/image'
import { ToastProvider } from './toast'
import { AuthProvider } from './auth'

interface Props {
  children: React.ReactNode
}

export function Provider({ children }: Props) {
  return (
    <SafeArea>
      <AuthProvider>
        <ToastProvider>
          <NavigationProvider>
            <SolitoImageProvider nextJsURL="https://skyhitz.io">
              {children}
            </SolitoImageProvider>
          </NavigationProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeArea>
  )
}
