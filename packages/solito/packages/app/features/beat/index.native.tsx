import * as React from 'react'
import { BeatScreen } from './screen'
import { useRoute } from '@react-navigation/native'

// Native-specific beat screen wrapper that handles loading state and route params
export function BeatScreenNative() {
  const route = useRoute()
  const routeParams = route.params as { id?: string } | undefined

  // Get the beat ID from the route params
  const id = routeParams?.id

  // Use the shared BeatScreen component for the actual UI, passing the ID from route params
  return <BeatScreen id={id} />
}

// Default export for native
export default BeatScreenNative
