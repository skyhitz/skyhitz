'use client'
import { FlatList } from 'react-native'
import { YStack, XStack, Button } from 'tamagui'
import { H3, P } from 'app/design/typography'
import { Entry } from 'app/api/graphql/types'
import { gql, useQuery } from '@apollo/client'
import { CollapsableView } from 'app/ui/CollapsableView'
import { UserAvatar } from 'app/ui/user-avatar'
import { useRouter } from 'app/navigation'

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
    router.push(`/profile/${userId}`)
  }

  const renderItem = ({ item }: { item: User }) => (
    <Button 
      onPress={() => navigateToProfile(item.id)}
      backgroundColor="transparent"
      padding="$0"
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

  return (
    <CollapsableView
      headerText="Liked By"
      initCollapsed={true}
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
    </CollapsableView>
  )
}

export default LikesList
