'use client'
import ProfileBeatsList from 'app/features/dashboard/profile/profileBeatsList'
import { useCollectorParam } from 'app/hooks/param/useCollectorParam'
import { useUserCollectionQuery } from 'app/api/graphql'
import { useErrorReport } from 'app/hooks/useErrorReport'
import { Config } from 'app/config'
import { useUserWithId } from 'app/hooks/algolia/useUserWithId'
import {
  ProfileHeader,
  SocialLinks,
} from 'app/features/dashboard/profile/ProfileHeader'
import { View } from 'react-native'
import { P, H1, ActivityIndicator } from 'app/design/typography'

export default function CollectorScreen() {
  const id = useCollectorParam()
  const reportError = useErrorReport()
  const user = useUserWithId(id)
  const collection = useUserCollectionQuery({
    skip: !id,
    variables: {
      userId: id!,
    },
  })
  const entries = collection.data?.userEntries ?? []

  //   useEffect(() => {
  //     if (collection.error) {
  //       reportError(collection.error)
  //     }
  //   }, [collection.error, reportError])

  //   useEffect(() => {
  //     if (user.error) {
  //       reportError(user.error)
  //     }
  //   }, [user.error, reportError])

  return (
    <View className="w-full flex-1">
      <View className="flex w-full flex-row items-center">
        {user.isValidating ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <ProfileHeader
              avatar={user.data?.avatarUrl!}
              background={user.data?.backgroundUrl!}
              displayName={user!.data?.displayName!}
            />
            <SocialLinks
              twitter={user!.data?.twitter!}
              instagram={user!.data?.instagram!}
              profileUrl={`${Config.APP_URL}/dashboard/collector/${id}`}
            />
          </>
        )}
      </View>

      <View className="mx-auto flex w-full max-w-6xl justify-start">
        <H1 className="pl-4 pt-16">{user!.data?.displayName!}</H1>
        <P className="mx-auto mt-6 w-full pl-4 text-lg font-bold">Bio</P>
        <P className="mx-auto mt-3 w-full pl-4">{user!.data?.description}</P>
      </View>
      <P className="font-unbounded w-fullpl-4 mx-auto mb-4 mt-6 text-lg font-bold">
        Collection
      </P>
      <ProfileBeatsList
        beats={entries}
        emptyStateText="Nothing in their collection yet"
        loading={collection.loading}
      />
    </View>
  )
}
