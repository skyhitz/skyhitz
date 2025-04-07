import { imageSrc } from 'app/utils/entry'
import { UserAvatar } from 'app/ui/userAvatar'
import Twitter from 'app/ui/icons/twitter'
import Instagram from 'app/ui/icons/instagram'
import { Linking, Pressable, View } from 'react-native'
import { ShareButton } from 'app/ui/buttons/ShareButton'
import { SolitoImage } from 'app/design/solito-image'

type Props = {
  background: string
  avatar: string
  displayName: string
}
export function ProfileHeader({ background, avatar, displayName }: Props) {
  return (
    <View className="h-40 w-full md:h-60">
      {background ? (
        <SolitoImage
          src={imageSrc(background)}
          contentFit="cover"
          fill
          alt="Avatar"
          // @ts-ignore
          className="h-40 w-full md:h-60"
        />
      ) : (
        <View className="h-40 w-full bg-gray-200 md:h-60" />
      )}

      <View className="absolute -bottom-8 left-5 flex-row items-end md:left-20">
        <UserAvatar
          avatarUrl={avatar}
          displayName={displayName}
          size="xlarge"
        />
      </View>
    </View>
  )
}

export function SocialLinks({
  twitter,
  instagram,
  profileUrl,
}: {
  twitter: string
  instagram: string
  profileUrl: string
}) {
  return (
    <View className="flex min-h-[1.5rem] flex-row-reverse">
      {!!twitter && (
        <Pressable
          className="ml-3 mr-3"
          onPress={() => Linking.openURL(`https://twitter.com/${twitter}`)}
        >
          <Twitter size={20} className="text-white" />
        </Pressable>
      )}
      {!!instagram && (
        <Pressable
          className="ml-3 mr-3"
          onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}
        >
          <Instagram size={20} className="text-white" />
        </Pressable>
      )}
      {!!profileUrl && (
        <View className="mr-3">
          <ShareButton url={profileUrl} title="Share profile" />
        </View>
      )}
    </View>
  )
}
