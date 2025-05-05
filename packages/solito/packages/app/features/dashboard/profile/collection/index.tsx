'use client'
import { View } from 'react-native'
import { useUserCollectionQuery } from 'app/api/graphql/mutations'
import { User } from 'app/api/graphql/types'
import { isSome } from 'app/utils'
import ProfileBeatsList from 'app/features/dashboard/profile/profileBeatsList'
import { P } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'

export default function CollectionScreen({ user }: { user: User }) {
  const { data, loading } = useUserCollectionQuery(user.id)
  const entries = data?.userEntries?.filter(isSome) ?? []

  return (
    <SafeAreaView className="bg-black">
      <View className="w-full flex-1">
        <P className="web:flex font-unbounded my-4 ml-8 hidden text-lg font-bold text-white">
          Collection
        </P>
        <ProfileBeatsList
          beats={entries}
          emptyStateText="Nothing in your collection yet"
          loading={loading}
        />
      </View>
    </SafeAreaView>
  )
}
