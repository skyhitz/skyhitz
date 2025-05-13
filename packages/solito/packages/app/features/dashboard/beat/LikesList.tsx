'use client'
import { View, FlatList, Pressable } from 'react-native'
import { H3, P } from 'app/design/typography'
import { Entry } from 'app/api/graphql/types'
import { gql, useQuery } from '@apollo/client'
import { CollapsableView } from 'app/ui/CollapsableView'
import { UserAvatar } from 'app/ui/user-avatar'
import { useRouter } from 'solito/router'

// Query to fetch users who liked the entry
const ENTRY_LIKES = gql`
  query EntryLikes($id: String!) {
    entryLikes(id: $id) {
      users {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`

type User = {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
}

type Props = {
  entry: Entry
}

export function LikesList({ entry }: Props) {
  const router = useRouter()
  const { data, loading } = useQuery(ENTRY_LIKES, {
    variables: { id: entry.id },
    skip: !entry.id,
  })

  const likes = data?.entryLikes?.users || []

  const navigateToProfile = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`)
  }

  const renderItem = ({ item }: { item: User }) => (
    <Pressable 
      onPress={() => navigateToProfile(item.id)}
      className="mb-2 flex flex-row items-center rounded-md p-2 hover:bg-gray-800"
    >
      <View className="mr-3">
        <UserAvatar
          avatarUrl={item.avatarUrl}
          displayName={item.displayName || item.username}
          userId={item.id}
          email={item.username}
          size="small"
        />
      </View>
      <View>
        <P className="font-semibold">{item.displayName || item.username}</P>
        <P className="text-xs text-gray-400">@{item.username}</P>
      </View>
    </Pressable>
  )

  return (
    <CollapsableView
      headerText="Liked By"
      initCollapsed={true}
      className="mt-4 w-full"
    >
      {loading ? (
        <P className="py-2 text-center text-gray-400">Loading likes...</P>
      ) : likes.length > 0 ? (
        <FlatList
          data={likes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      ) : (
        <P className="py-2 text-center text-gray-400">No likes yet</P>
      )}
    </CollapsableView>
  )
}

export default LikesList
