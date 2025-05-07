'use client'
import { ScrollView, View } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { ActivityIndicator, H1, Button } from 'app/design/typography'
import { useTopChart } from 'app/hooks/algolia/useTopChart'
import { Entry } from 'app/api/graphql/types'
import { SafeAreaView } from 'app/design/safe-area-view'
import Footer from 'app/ui/footer'

import { useTheme } from 'app/state/theme/useTheme'

export function ChartScreen({ entries }: { entries: Entry[] }) {
  const {
    data: extraEntries,
    isLoadingMore,
    onNextPage,
    loadMoreEnabled,
  } = useTopChart(1)
  const { theme } = useTheme()

  const playlist = [...entries, ...extraEntries]

  return (
    <SafeAreaView className="bg-[--bg-color]">
      <View className="mx-auto flex w-full flex-1">
        <ScrollView>
          <View className="mx-auto mb-32 w-full max-w-7xl px-2 lg:px-8">
            {/* Trending header with styling that matches legacy app */}
            <View className="mb-4">
              <H1 className="py-2 text-xl font-bold sm:text-2xl">Trending</H1>
              <View style={{ borderBottomWidth: 1, borderBottomColor: 'var(--border-color)' }} />
            </View>
            
            {/* Main content with border styling matching legacy app */}
            <View className="rounded-lg overflow-hidden">
              {/* Original entries */}
              {entries.map((entry, index) => {
                return (
                  <BeatListEntry
                    key={entry.id || index}
                    entry={entry}
                    spot={index + 1}
                    playlist={playlist}
                  />
                )
              })}

              {/* Extra entries loaded with "Load More" */}
              {extraEntries.map((entry, index) => {
                return (
                  <BeatListEntry
                    key={entry.id || index}
                    entry={entry}
                    spot={entries.length + index + 1}
                    playlist={playlist}
                  />
                )
              })}
            </View>
            <View className="mt-16 flex h-12 items-center justify-center">
              {isLoadingMore ? (
                <ActivityIndicator size={'small'} />
              ) : (
                loadMoreEnabled && (
                  <Button
                    onPress={() => {
                      onNextPage()
                    }}
                  >
                    Load More →
                  </Button>
                )
              )}
            </View>
          </View>
          <Footer />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
