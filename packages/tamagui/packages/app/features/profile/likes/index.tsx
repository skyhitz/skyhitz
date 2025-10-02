'use client'
import { YStack } from 'tamagui'
import { useUserLikesQuery } from 'app/api/graphql/mutations'
import { isSome } from 'app/utils'
import ProfileBeatsList from 'app/features/profile/profileBeatsList'
import { P } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'

export default function LikesScreen() {
  const { data, loading } = useUserLikesQuery()
  const entries = data?.userLikes?.filter(isSome) ?? []

  return (
    <SafeAreaView backgroundColor="$background">
      <YStack width="100%" flex={1} paddingBottom="$16">
        <P display={{ xs: 'none', md: 'flex' }} fontFamily="$heading" marginVertical="$4" marginLeft="$8" fontSize="$5" fontWeight="bold">
          Likes
        </P>
        <ProfileBeatsList
          beats={entries}
          emptyStateText="Nothing in your favorites list yet"
          loading={loading}
        />
      </YStack>
    </SafeAreaView>
  )
}
