'use client'
import { YStack } from 'tamagui'
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
    <YStack marginTop="$8" flex={1} alignItems="center" justifyContent="center">
      <P>{emptyStateText}</P>
    </YStack>
  )
}

export default function ProfileBeatsList({
  beats,
  emptyStateText,
  loading,
}: ProfileBeatsListProps) {
  return (
    <YStack marginHorizontal="auto" width="100%" maxWidth="$6xl" flex={1} paddingHorizontal="$5">
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
    </YStack>
  )
}
