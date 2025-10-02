'use client'

import { Entry } from 'app/api/graphql/types'
import { FlatList, Platform } from 'react-native'
import { YStack, XStack, Button } from 'tamagui'
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
export default function ClientLikesList({ entry }: Props) {
  const { data, loading } = useQuery(ENTRY_LIKES, {
    variables: { id: entry.id },
    skip: !entry.id,
  })

  const likes = data?.entryLikes?.users || []

  const renderItem = ({ item }: { item: User }) => {
    // For web, use a native anchor tag that doesn't require router
    if (Platform.OS === 'web') {
      return (
        <XStack marginBottom="$2" flexDirection="row" alignItems="center" borderRadius="$2" padding="$2" hoverStyle={{ backgroundColor: '$gray8' }}>
          <YStack marginRight="$3">
            <UserAvatar
              avatarUrl={item.avatarUrl}
              displayName={item.displayName || item.username}
              userId={item.id}
              email={item.username}
              size="small"
            />
          </YStack>
          <YStack>
            <P fontWeight="600">{item.displayName || item.username}</P>
            <P fontSize="$2" color="$gray9">@{item.username}</P>
          </YStack>
        </XStack>
      )
    }

    // For native, use a Pressable with a window.location approach
    return (
      <Button 
        backgroundColor="transparent"
        padding="$0"
        onPress={() => {}}
        marginBottom="$2"
        borderRadius="$2"
        paddingHorizontal="$2"
        paddingVertical="$2"
        hoverStyle={{ backgroundColor: '$gray8' }}
      >
        <XStack flexDirection="row" alignItems="center">
          <YStack marginRight="$3">
            <UserAvatar
              avatarUrl={item.avatarUrl}
              displayName={item.displayName || item.username}
              userId={item.id}
              email={item.username}
              size="small"
            />
          </YStack>
          <YStack>
            <P fontWeight="600">{item.displayName || item.username}</P>
            <P fontSize="$2" color="$gray9">@{item.username}</P>
          </YStack>
        </XStack>
      </Button>
    )
  }

  return (
    likes.length > 0 || loading ? <CollapsableView
      headerText="Likes"
      initCollapsed={true}
      icon={Like}
    >
      {loading ? (
        <P paddingVertical="$2" textAlign="center" color="$gray9">Loading likes...</P>
      ) : likes.length > 0 ? (
        <FlatList
          data={likes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      ) : (
        <P paddingVertical="$2" textAlign="center" color="$gray9">No likes yet</P>
      )}
    </CollapsableView> : null
  )
}
