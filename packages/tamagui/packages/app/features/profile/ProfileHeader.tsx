'use client'
import { imageSrc } from 'app/utils/entry'
import { UserAvatar } from 'app/ui/user-avatar'
import XLogo from 'app/ui/icons/x-logo'
import Instagram from 'app/ui/icons/instagram'
import { Linking } from 'react-native'
// import { ShareButton } from 'app/ui/buttons/ShareButton'
import { SolitoImage } from 'app/design/solito-image'
import { User } from 'app/api/graphql/types'
import { H3, P } from 'app/design/typography'
import { Config } from 'app/config'
import { YStack, XStack, Button } from 'tamagui'

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
    <XStack minHeight={24} flexDirection="row-reverse" alignItems="center">
      {/* Share button placeholder */}
      <YStack key="share">
        {/* <ShareButton url={profileUrl} title="Share profile" /> */}
      </YStack>

      {/* Instagram */}
      {instagram && (
        <YStack key="instagram" marginHorizontal="$2">
          <Button
            onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}
            backgroundColor="transparent"
            padding="$0"
          >
            <Instagram width={24} height={24} fill="none" strokeWidth={1.5} stroke="$color12" />
          </Button>
        </YStack>
      )}

      {/* X (Twitter) */}
      {twitter && (
        <YStack key="x" marginHorizontal="$2">
          <Button
            onPress={() => Linking.openURL(`https://x.com/${twitter}`)}
            backgroundColor="transparent"
            padding="$0"
          >
            <XLogo width={24} height={24} color="$color12" />
          </Button>
        </YStack>
      )}
    </XStack>
  )
}

type ProfileHeaderProps = {
  user: User
  action?: React.ReactNode
}

export function ProfileHeader({ user, action }: ProfileHeaderProps) {
  const profileUrl = `${Config.APP_URL}/collector/${user.id}`

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
    <YStack height={160} width="100%" backgroundColor="$gray8" md={{ height: 240 }} />
  )

  return (
    <YStack width="100%">
      <YStack height={160} width="100%" md={{ height: 240 }} position="relative">
        {backgroundElement}
        <XStack
          position="absolute"
          bottom={-32}
          left={20}
          md={{ left: 80 }}
          flexDirection="row"
          alignItems="flex-end"
        >
          <UserAvatar
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
            size="xlarge"
          />
        </XStack>
      </YStack>

      <XStack
        marginTop="$12"
        width="100%"
        flexDirection="row"
        alignItems="flex-start"
        justifyContent="space-between"
        paddingHorizontal={20}
        md={{ paddingHorizontal: 80 }}
      >
        <YStack flexDirection="column">
          <H3>{user.displayName}</H3>
          <P>@{user.username}</P>
        </YStack>

        <XStack flexDirection="row" alignItems="center">
          <SocialLinks
            twitter={user.twitter || ''}
            instagram={user.instagram || ''}
            profileUrl={profileUrl}
          />
          {action ? action : null}
        </XStack>
      </XStack>
    </YStack>
  )
}
