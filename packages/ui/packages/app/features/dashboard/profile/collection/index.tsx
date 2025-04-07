'use client'
import { View } from 'react-native'
import { User, useUserCollectionQuery } from 'app/api/graphql'
import { isSome } from 'app/utils'
import ProfileBeatsList from 'app/features/dashboard/profile/profileBeatsList'
import { P } from 'app/design/typography'

export default function CollectionScreen({ user }: { user: User }) {
  const { data, loading } = useUserCollectionQuery({
    variables: {
      userId: user.id,
    },
  })
  const entries = data?.userEntries?.filter(isSome) ?? []

  return (
    <View className="w-full flex-1">
      <P className="web:flex font-unbounded my-4 ml-8 hidden text-lg font-bold">
        Collection
      </P>
      <ProfileBeatsList
        beats={entries}
        emptyStateText="Nothing in your collection yet"
        loading={loading}
      />
    </View>
  )
}
