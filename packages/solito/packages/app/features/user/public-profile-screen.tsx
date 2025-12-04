'use client'
import { View, ScrollView } from 'react-native'
import { UserAvatar } from 'app/ui/user-avatar'
import { SolitoImage } from 'app/design/solito-image'
import { H1, H3, P } from 'app/design/typography'
import { Config } from 'app/config'
import { imageSrc, imageUrlMedium } from 'app/utils/entry'
import { SafeAreaView } from 'app/design/safe-area-view'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { Entry } from 'app/api/graphql/types'
import XLogo from 'app/ui/icons/x-logo'
import Instagram from 'app/ui/icons/instagram'
import { Linking, Pressable } from 'react-native'
import Footer from 'app/ui/footer'

// Public user type that matches what we get from Algolia
export interface PublicUserData {
  id: string
  username: string
  displayName: string
  description?: string
  avatarUrl?: string
  backgroundUrl?: string
  publishedAtTimestamp?: number | string
  twitter?: string
  instagram?: string
}

type PublicProfileScreenProps = {
  user: PublicUserData
  entries?: Entry[]
}

function SocialLinks({
  twitter,
  instagram,
}: {
  twitter?: string
  instagram?: string
}) {
  const socialItems = []

  if (instagram) {
    socialItems.push(
      <View key="instagram" className="mx-2">
        <Pressable
          onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}
          accessibilityLabel={`Visit ${instagram} on Instagram`}
        >
          <Instagram className="h-6 w-6 fill-none stroke-[1.5] stroke-[--text-color]" />
        </Pressable>
      </View>
    )
  }

  if (twitter) {
    socialItems.push(
      <View key="x" className="mx-2">
        <Pressable
          onPress={() => Linking.openURL(`https://x.com/${twitter}`)}
          accessibilityLabel={`Visit ${twitter} on X`}
        >
          <XLogo className="h-6 w-6 text-[--text-color]" />
        </Pressable>
      </View>
    )
  }

  if (socialItems.length === 0) return null

  return <View className="flex min-h-[1.5rem] flex-row-reverse">{socialItems}</View>
}

export function PublicProfileScreen({ user, entries = [] }: PublicProfileScreenProps) {
  const profileUrl = `${Config.APP_URL}/users/${user.id}`

  // Background element
  const backgroundElement = user.backgroundUrl ? (
    <SolitoImage
      src={imageSrc(user.backgroundUrl)}
      contentFit="cover"
      fill
      alt={`${user.displayName}'s background`}
      sizes="100vw"
    />
  ) : (
    <View className="h-40 w-full bg-gradient-to-br from-gray-800 to-gray-900 md:h-60" />
  )

  return (
    <SafeAreaView className="flex-1 bg-[--bg-color]">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="w-full">
          <View className="relative h-40 w-full overflow-hidden md:h-60">
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
              <H3>{user.displayName || 'Anonymous'}</H3>
              <P className="text-[--text-secondary-color]">@{user.username}</P>
              {user.description && (
                <P className="mt-2 max-w-lg text-[--text-secondary-color]">
                  {user.description}
                </P>
              )}
            </View>

            <View className="flex flex-row items-center">
              <SocialLinks twitter={user.twitter} instagram={user.instagram} />
            </View>
          </View>
        </View>

        {/* Collection Section */}
        <View className="mx-auto mt-8 w-full max-w-6xl px-5 pb-32">
          <H1 className="mb-4 text-lg font-bold">Collection</H1>
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: 'var(--border-color)',
            }}
            className="mb-4"
          />

          {entries.length > 0 ? (
            <View>
              {entries.map((entry) => (
                <BeatListEntry key={entry.id} entry={entry} playlist={entries} />
              ))}
            </View>
          ) : (
            <View className="flex items-center justify-center py-12">
              <P className="text-[--text-secondary-color]">No items in collection yet</P>
            </View>
          )}
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  )
}

