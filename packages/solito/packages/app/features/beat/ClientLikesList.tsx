'use client'

import { Entry } from 'app/api/graphql/types'
import { View, FlatList, Pressable, Platform } from 'react-native'
import { H3, P } from 'app/design/typography'
import { gql, useQuery } from '@apollo/client'
import { CollapsableView } from 'app/ui/CollapsableView'
import { UserAvatar } from 'app/ui/user-avatar'
import Like from 'app/ui/icons/like'

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

// This is a client component that handles all router functionality
export default function ClientLikesList({ entry }: Props): JSX.Element {
  const { data, loading } = useQuery(ENTRY_LIKES, {
    variables: { id: entry.id },
    skip: !entry.id,
  })

  const likes = data?.entryLikes?.users || []

  const renderItem = ({ item }: { item: User }) => {
    // For web, use a native anchor tag that doesn't require router
    if (Platform.OS === 'web') {
      return (
        <a
          href={`/collector/${item.id}`}
          className="mb-2 flex flex-row items-center rounded-md p-2 hover:bg-gray-800 no-underline"
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
        </a>
      )
    }

    // For native, use a Pressable with a window.location approach
    return (
      <Pressable
        onPress={() => {
          if (Platform.OS === 'web') {
            window.location.href = `/collector/${item.id}`
          }
          // Note: For native, we'd need a navigation solution that doesn't rely on router
          // This component is only used in web currently so we're focusing on that
        }}
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
  }

  return (
    <CollapsableView
      headerText="Likes"
      initCollapsed={true}
      className="mt-4 w-full"
      icon={Like}
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
