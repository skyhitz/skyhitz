'use client'
import { imageSrc } from 'app/utils/entry'
import { UserAvatar } from 'app/ui/user-avatar'
import Twitter from 'app/ui/icons/twitter'
import Instagram from 'app/ui/icons/instagram'
import { Linking, Pressable, View } from 'react-native'
import { ShareButton } from 'app/ui/buttons/ShareButton'
import { SolitoImage } from 'app/design/solito-image'
import { User } from 'app/api/graphql/types'
import { H3, P } from 'app/design/typography'
import { Config } from 'app/config'
import { useTheme } from 'app/state/theme/useTheme'

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
  const { colors } = useTheme();
  
  // Using array of elements to avoid any whitespace text nodes
  const socialItems = [
    // Share button
    <View key="share">
      <ShareButton url={profileUrl} title="Check out this Skyhitz profile" />
    </View>
  ];
  
  // Add Instagram if available
  if (instagram) {
    socialItems.push(
      <View key="instagram" className="mx-2">
        <Pressable onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}>
          <Instagram className="h-6 w-6 fill-none stroke-[1.5]" stroke={colors.text} />
        </Pressable>
      </View>
    );
  }
  
  // Add Twitter if available
  if (twitter) {
    socialItems.push(
      <View key="twitter" className="mx-2">
        <Pressable onPress={() => Linking.openURL(`https://twitter.com/${twitter}`)}>
          <Twitter className="h-6 w-6 fill-none stroke-[1.5]" stroke={colors.text} />
        </Pressable>
      </View>
    );
  }
  
  return (
    <View className="flex min-h-[1.5rem] flex-row-reverse">
      {socialItems}
    </View>
  );
}

type ProfileHeaderProps = {
  user: User
  action?: React.ReactNode
}

export function ProfileHeader({ user, action }: ProfileHeaderProps) {
  const profileUrl = `${Config.APP_URL}/collector/${user.id}`
  const { colors } = useTheme()
  
  // Create the background element
  const backgroundElement = user.backgroundUrl ? (
    <SolitoImage
      src={imageSrc(user.backgroundUrl)}
      contentFit="cover"
      fill
      alt="Background"
      sizes="100vw"
    />
  ) : (
    <View className="h-40 w-full bg-gray-800 md:h-60" />
  );
  
  return (
    <View className="w-full">
      <View className="h-40 w-full md:h-60">
        {backgroundElement}
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
          <H3 style={{ color: colors.text }}>{user.displayName}</H3>
          <P style={{ color: colors.text }}>@{user.username}</P>
        </View>

        <View className="flex flex-row items-center">
          <SocialLinks
            twitter={user.twitter || ''}
            instagram={user.instagram || ''}
            profileUrl={profileUrl}
          />
          {action ? action : null}
        </View>
      </View>
    </View>
  )
}
