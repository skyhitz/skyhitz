import * as React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SearchScreen } from './screen'

// Native-specific search screen wrapper that handles loading state
export function SearchScreenNative() {
  // Only a simple loading state is needed - no data fetching required
  const [initialLoading, setInitialLoading] = React.useState(true)

  // Simulate brief loading for UX consistency
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Use the shared SearchScreen component for the actual UI
  return <SearchScreen />
}

// Default export for native
export default SearchScreenNative
