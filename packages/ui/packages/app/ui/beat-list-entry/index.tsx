import { P } from 'app/design/typography'
import { Platform, View } from 'react-native'
import { Entry } from 'app/api/graphql'
import { Pressable } from 'react-native'
import LikeButton from 'app/ui/buttons/likeButton'
import VerticalDots from 'app/ui/icons/verticalDots'
import { ReactElement } from 'react'
import { imageUrlSmall } from 'app/utils/entry'
import { usePlayback } from 'app/hooks/usePlayback'
import { SolitoImage } from 'app/design/solito-image'
import DownloadBtn from '../buttons/DownloadBtn'
import { useLink } from 'solito/navigation'
import { stroopsToLumens } from 'app/utils'
import Icon from '../icons/dollar'

export type PressableState = Readonly<{
  hovered?: boolean
}>

export function BeatListEntry({
  entry,
  spot,
  playlist,
}: {
  entry: Entry
  spot?: number
  playlist: Entry[]
}) {
  const { playEntry } = usePlayback()

  const linkProps = useLink({
    href: `/dashboard/beat/${entry.id}`,
  })
  const tvl = entry.tvl ? stroopsToLumens(entry.tvl) : 0

  return (
    <Pressable onPress={() => playEntry(entry, playlist)} className="flex">
      {({ hovered }: PressableState): ReactElement => {
        return (
          <View className="flex flex-row items-center py-2">
            <View className="aspect-[2/2] w-12 object-cover">
              <SolitoImage
                src={imageUrlSmall(entry.imageUrl)}
                alt={entry.title}
                contentFit="cover"
                fill
                sizes="4rem"
                style={{ borderRadius: 6 }}
              />
            </View>
            {spot && (
              <P className="ml-2 w-8 text-center text-2xl leading-none">
                {spot}
              </P>
            )}
            <View className="ml-2 flex flex-1 justify-center pr-2">
              <P numberOfLines={1} className="text-sm font-bold leading-6">
                {entry.title}
              </P>
              <P
                numberOfLines={1}
                className="text-xs leading-6 text-neutral-400"
              >
                {entry.artist}
              </P>
              {entry.tvl && entry.apr ? (
                <Pressable
                  className="flex flex-row items-center md:hidden"
                  {...linkProps}
                >
                  <P className="mr-3 flex flex-row items-center text-xs leading-6">
                    TVL : <Icon className={'mx-1'} size={10} />
                    {tvl}
                  </P>
                  <P className="mr-3 text-xs leading-6">APR : {entry.apr}%</P>
                </Pressable>
              ) : null}
            </View>
            <View className="flex flex-row items-center">
              {entry.tvl && entry.apr ? (
                <Pressable
                  className="hidden flex-row items-center md:flex"
                  {...linkProps}
                >
                  <P className="font-unbounded mr-3 flex flex-row items-center text-xs">
                    TVL : <Icon className={'mx-1'} size={10} />
                    {tvl}
                  </P>
                  <P className="font-unbounded mr-3 text-xs">
                    APR : {entry.apr}%
                  </P>
                </Pressable>
              ) : null}

              {Platform.OS === 'web' && (
                <DownloadBtn size={14} className="mr-3" entry={entry} />
              )}
              <LikeButton size={20} entry={entry} />
              <Pressable {...linkProps} className="text-gray-600">
                <VerticalDots size={30} />
              </Pressable>
            </View>
          </View>
        )
      }}
    </Pressable>
  )
}
