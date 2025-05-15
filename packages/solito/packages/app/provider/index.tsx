'use client'
import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation'
import { SolitoImageProvider } from 'solito/image'
import { ToastProvider } from './toast'
import { AuthProvider } from './auth'
import { GraphQLProvider } from './apollo'
import { PlaybackProvider } from './playback'

interface Props {
  children: React.ReactNode
}

export function Provider({ children }: Props) {
  return (
    <GraphQLProvider>
      <SafeArea>
        <AuthProvider>
          <ToastProvider>
            <NavigationProvider>
              <PlaybackProvider>
                <SolitoImageProvider nextJsURL="https://skyhitz.io">
                  {children}
                </SolitoImageProvider>
              </PlaybackProvider>
            </NavigationProvider>
          </ToastProvider>
        </AuthProvider>
      </SafeArea>
    </GraphQLProvider>
  )
}
