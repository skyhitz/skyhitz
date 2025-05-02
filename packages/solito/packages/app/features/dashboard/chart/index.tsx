'use client'
import { ScrollView, View } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { ActivityIndicator, H1, Button } from 'app/design/typography'
import { useTopChart } from 'app/hooks/algolia/useTopChart'
import { Entry } from 'app/api/graphql/types'
import { SafeAreaView } from 'app/design/safe-area-view'
import Footer from 'app/ui/footer'

export function ChartScreen({ entries }: { entries: Entry[] }) {
  const {
    data: extraEntries,
    isLoadingMore,
    onNextPage,
    loadMoreEnabled,
  } = useTopChart(1)

  const playlist = [...entries, ...extraEntries]

  return (
    <SafeAreaView className="bg-black">
      <View className="mx-auto flex w-full flex-1">
        <ScrollView>
          <View className="mx-auto mb-32 w-full max-w-7xl px-2 lg:px-8">
            <H1 className="text-base text-white sm:text-2xl">Trending</H1>
            <View className="mb-4 border-b border-gray-700 sm:my-4" />
            <View>
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

              {extraEntries.map((entry, index) => {
                return (
                  <BeatListEntry
                    key={entry.id || index}
                    entry={entry}
                    spot={20 + index + 1}
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
