'use client'
import { View } from 'react-native'
import { FlatList } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { Entry } from 'app/api/graphql/types'
import { CollectionSkeleton } from 'app/ui/skeletons/CollectionSkeleton'
import { P } from 'app/design/typography'

type ProfileBeatsListProps = {
  beats: Entry[]
  emptyStateText: string
  loading: boolean
}

function ListEmptyComponent({
  emptyStateText,
  loading,
}: {
  emptyStateText: string
  loading: boolean
}) {
  if (loading) return <CollectionSkeleton duplicates={3} />

  return (
    <View className="mt-8 flex flex-1 items-center justify-center">
      <P>{emptyStateText}</P>
    </View>
  )
}

export default function ProfileBeatsList({
  beats,
  emptyStateText,
  loading,
}: ProfileBeatsListProps) {
  return (
    <View className="mx-auto w-full max-w-6xl flex-1 px-5">
      <FlatList
        keyExtractor={(item) => item.id!}
        data={beats}
        renderItem={({ item }) => (
          <BeatListEntry entry={item} playlist={beats} />
        )}
        ListEmptyComponent={
          <ListEmptyComponent
            emptyStateText={emptyStateText}
            loading={loading}
          />
        }
      />
    </View>
  )
}
