import { User } from 'app/api/graphql'
import { P } from 'app/design/typography'
import { UserAvatar } from 'app/ui/userAvatar'
import { Pressable, View } from 'react-native'
import { useRouter } from 'solito/navigation'

export function MakerListEntry({ user }: { user: User }) {
  const { push } = useRouter()

  return (
    <Pressable onPress={() => push(`/dashboard/collector/${user.id}/`)}>
      <View className="flex w-full flex-row items-center py-2">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          size="small"
        />
        <View>
          <View className="flex flex-1 justify-center px-2">
            <P numberOfLines={1} className="text-xs font-bold">
              {user.username}
            </P>
            <P numberOfLines={1} className="mt-1 text-xs">
              {user.displayName}
            </P>
          </View>
        </View>
      </View>
    </Pressable>
  )
}
