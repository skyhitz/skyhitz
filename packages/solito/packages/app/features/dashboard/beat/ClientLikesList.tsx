'use client'

import { Entry } from 'app/api/graphql/types'
import { View, FlatList, Pressable, Platform } from 'react-native'
import { H3, P } from 'app/design/typography'
import { gql, useQuery } from '@apollo/client'
import { CollapsableView } from 'app/ui/CollapsableView'
import Image from 'app/design/image'
import { imageUrlMedium } from 'app/utils/entry'

// Query to fetch users who liked the entry
const ENTRY_LIKES = gql`
  query EntryLikes($id: String!) {
    entryLikes(id: $id) {
      id
      username
      displayName
      avatarUrl
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

  const likes = data?.entryLikes || []

  const renderItem = ({ item }: { item: User }) => {
    // For web, use a native anchor tag that doesn't require router
    if (Platform.OS === 'web') {
      return (
        <a 
          href={`/dashboard/profile/${item.id}`}
          className="mb-2 flex flex-row items-center rounded-md p-2 hover:bg-gray-800 no-underline"
        >
          <View className="mr-3 h-10 w-10 overflow-hidden rounded-full">
            <Image
              source={{ uri: item.avatarUrl ? imageUrlMedium(item.avatarUrl) : undefined }}
              width={40}
              height={40}
              alt={item.displayName || item.username}
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
            window.location.href = `/dashboard/profile/${item.id}`
          }
          // Note: For native, we'd need a navigation solution that doesn't rely on router
          // This component is only used in web currently so we're focusing on that
        }}
        className="mb-2 flex flex-row items-center rounded-md p-2 hover:bg-gray-800"
      >
        <View className="mr-3 h-10 w-10 overflow-hidden rounded-full">
          <Image
            source={{ uri: item.avatarUrl ? imageUrlMedium(item.avatarUrl) : undefined }}
            width={40}
            height={40}
            alt={item.displayName || item.username}
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
