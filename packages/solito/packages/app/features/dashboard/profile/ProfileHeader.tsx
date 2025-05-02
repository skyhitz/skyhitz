'use client'
import { imageSrc } from 'app/utils/entry'
import { UserAvatar } from 'app/ui/userAvatar'
import Twitter from 'app/ui/icons/twitter'
import Instagram from 'app/ui/icons/instagram'
import { Linking, Pressable, View } from 'react-native'
import { ShareButton } from 'app/ui/buttons/ShareButton'
import { SolitoImage } from 'app/design/solito-image'
import { User } from 'app/api/graphql/types'
import { H3, P } from 'app/design/typography'
import { Config } from 'app/config'

type SocialLinksProps = {
  twitter: string
  instagram: string
  profileUrl: string
}

export function SocialLinks({
  twitter,
  instagram,
  profileUrl,
}: SocialLinksProps) {
  return (
    <View className="flex min-h-[1.5rem] flex-row-reverse">
      <ShareButton url={profileUrl} title="Check out this Skyhitz profile" />
      {instagram && (
        <Pressable
          className="mx-2"
          onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}
        >
          <Instagram className="h-6 w-6 fill-none stroke-current stroke-[1.5] text-white" />
        </Pressable>
      )}
      {twitter && (
        <Pressable
          className="mx-2"
          onPress={() => Linking.openURL(`https://twitter.com/${twitter}`)}
        >
          <Twitter className="h-6 w-6 fill-none stroke-current stroke-[1.5] text-white" />
        </Pressable>
      )}
    </View>
  )
}

type ProfileHeaderProps = {
  user: User
  action?: React.ReactNode
}

export function ProfileHeader({ user, action }: ProfileHeaderProps) {
  const profileUrl = `${Config.APP_URL}/collector/${user.id}`
  
  return (
    <View className="w-full">
      <View className="h-40 w-full md:h-60">
        {user.backgroundImage ? (
          <SolitoImage
            src={imageSrc(user.backgroundImage)}
            contentFit="cover"
            fill
            alt="Background"
            sizes="100vw"
          />
        ) : (
          <View className="h-40 w-full bg-gray-800 md:h-60" />
        )}

        <View className="absolute -bottom-8 left-5 flex-row items-end md:left-20">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
            size="xlarge"
          />
        </View>
      </View>

      <View className="mt-12 flex w-full flex-row items-start justify-between px-5 md:px-20">
        <View className="flex flex-col">
          <H3 className="text-white">{user.displayName}</H3>
          <P className="text-white">@{user.username}</P>
        </View>

        <View className="flex flex-row items-center">
          <SocialLinks
            twitter={user.twitter || ''}
            instagram={user.instagram || ''}
            profileUrl={profileUrl}
          />
          {action}
        </View>
      </View>
    </View>
  )
}
