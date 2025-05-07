'use client'
import { View } from 'react-native'
import { useUserLikesQuery } from 'app/api/graphql/mutations'
import { isSome } from 'app/utils'
import ProfileBeatsList from 'app/features/dashboard/profile/profileBeatsList'
import { P } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'

export default function LikesScreen() {
  const { data, loading } = useUserLikesQuery()
  const entries = data?.userLikes?.filter(isSome) ?? []

  return (
    <SafeAreaView className="bg-[--bg-color]">
      <View className="w-full flex-1">
        <P className="web:flex font-unbounded my-4 ml-8 hidden text-lg font-bold text-[--text-color]">
          Likes
        </P>
        <ProfileBeatsList
          beats={entries}
          emptyStateText="Nothing in your favorites list yet"
          loading={loading}
        />
      </View>
    </SafeAreaView>
  )
}
