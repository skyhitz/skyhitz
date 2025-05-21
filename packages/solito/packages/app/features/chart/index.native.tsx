'use client'
import * as React from 'react'
import { ChartScreen } from './screen'
import { View, ActivityIndicator } from 'react-native'
import { P } from 'app/design/typography'
import { useTopChart } from 'app/hooks/algolia/useTopChart'

// Native-specific wrapper for ChartScreen that handles data fetching
export function ChartScreenNative() {
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Use the same hook as the main component to get top chart entries
  const { data: entries, loading: dataLoading } = useTopChart(0)

  // Effect to set initial loading state to false once data is fetched
  React.useEffect(() => {
    if (entries || error) {
      setInitialLoading(false)
    }
  }, [entries, error])

  // Simple loading and error states for native
  if (dataLoading || initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <P>Error loading chart data: {error}</P>
      </View>
    )
  }

  // Render the main ChartScreen with the fetched entries
  return <ChartScreen entries={entries} />
}

// Default export for native
export default ChartScreenNative
