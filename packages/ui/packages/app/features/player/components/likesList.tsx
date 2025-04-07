import { Entry, PublicUser, useEntryLikesQuery } from 'app/api/graphql'
import { ActivityIndicator, View } from 'react-native'
import LikeButton from 'app/ui/buttons/likeButton'
import { UserAvatar } from 'app/ui/userAvatar'
import { FlatList } from 'react-native'
import { isSome } from 'app/utils'
import { AndroidHorizontalList } from 'app/ui/Lists/AndroidHorizontalList'
import { P } from 'app/design/typography'
import { CollapsableView } from 'app/ui/CollapsableView'
import Like from 'app/ui/icons/like'
import { IconProps } from 'app/types'

const FilledLike = (iconProps: IconProps) => Like({ ...iconProps, fill: true })

type Props = {
  entry: Entry
  classname?: string
  showLikeButton?: boolean
  useAndroidHorizontalList?: boolean
}

export function LikesList({
  entry,
  classname = '',
  showLikeButton,
  useAndroidHorizontalList = false,
}: Props) {
  const { data, loading } = useEntryLikesQuery({
    variables: {
      id: entry.id,
    },
  })

  const renderItem = ({ item }: { item: PublicUser }) => {
    return (
      <View className="mr-2" key={item.id}>
        <UserAvatar avatarUrl={item.avatarUrl} displayName={item.displayName} />
      </View>
    )
  }

  return (
    data?.entryLikes?.users &&
    data?.entryLikes?.users.length > 0 && (
      <CollapsableView icon={FilledLike} headerText="Likes">
        <View className={`flex w-full p-5 ${classname}`}>
          <View className="flex flex-row items-center justify-between">
            {showLikeButton && <LikeButton size={24} entry={entry} />}
          </View>
          <View className="min-h-10 mt-2.5 flex flex-row">
            {useAndroidHorizontalList ? (
              <AndroidHorizontalList
                data={data?.entryLikes?.users?.filter(isSome) ?? []}
                renderItem={(item) => renderItem({ item })}
                listEmptyComponent={<ListEmptyComponent loading={loading} />}
              />
            ) : (
              <FlatList
                data={data?.entryLikes?.users?.filter(isSome)}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={<ListEmptyComponent loading={loading} />}
              />
            )}
          </View>
        </View>
      </CollapsableView>
    )
  )
}

function ListEmptyComponent({ loading }: { loading: boolean }) {
  return (
    <View className="flex items-center justify-center">
      {loading ? (
        <ActivityIndicator />
      ) : (
        <P className="text-sm">Be first to like this beat</P>
      )}
    </View>
  )
}
