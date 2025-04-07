import { FlatList } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { useRecentlyAdded } from 'app/hooks/algolia/useRecentlyAdded'
import { BeatSkeleton } from 'app/ui/skeletons/BeatSkeleton'
import { H1 } from 'app/design/typography'

export default function RecentlyAddedList() {
  const { data, onNextPage, loading } = useRecentlyAdded()

  if (loading) {
    return <BeatSkeleton />
  }

  return (
    <FlatList
      ListHeaderComponent={ListHeader}
      data={data}
      keyExtractor={(item) => item.id!}
      renderItem={({ item }) => <BeatListEntry entry={item} playlist={data} />}
      showsVerticalScrollIndicator={false}
      onEndReached={onNextPage}
      onEndReachedThreshold={0.1}
    />
  )
}

function ListHeader() {
  return (
    <H1 className="font-unbounded mb-0 mt-0.5 pb-4 text-base">
      Recently Added
    </H1>
  )
}
