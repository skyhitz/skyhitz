'use client'
import { YStack } from 'tamagui'
import { useUserCollectionQuery } from 'app/api/graphql/mutations'
import { User } from 'app/api/graphql/types'
import { isSome } from 'app/utils'
import ProfileBeatsList from 'app/features/profile/profileBeatsList'
import { P } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'

export default function CollectionScreen({ user }: { user: User }) {
  const { data, loading } = useUserCollectionQuery(user.id)
  const entries = data?.userEntries?.filter(isSome) ?? []

  return (
    <SafeAreaView backgroundColor="$background">
      <YStack width="100%" flex={1} paddingBottom="$16">
        <P display={{ xs: 'none', md: 'flex' }} fontFamily="$heading" marginVertical="$4" marginLeft="$8" fontSize="$5" fontWeight="bold">
          Collection
        </P>
        <ProfileBeatsList
          beats={entries}
          emptyStateText="Nothing in your collection yet"
          loading={loading}
        />
      </YStack>
    </SafeAreaView>
  )
}
