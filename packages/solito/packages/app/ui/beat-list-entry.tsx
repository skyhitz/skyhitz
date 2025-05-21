'use client'
import { View, Pressable } from 'react-native'
import { Entry } from 'app/api/graphql/types'
import { P } from 'app/design/typography'
import { imageUrlSmall } from 'app/utils/entry'
import { useRouter } from 'solito/navigation'
import { SolitoImage } from 'app/design/solito-image'
import VerticalDots from 'app/ui/icons/verticalDots'
import LikeButton from 'app/ui/buttons/likeButton'
// import DownloadBtn from 'app/ui/buttons/download'
import Stellar from 'app/ui/icons/stellar'
import { stroopsToLumens } from 'app/utils/stroopsToLumens'

// Reusable component for APR text with consistent styling
function APRText({ apr }: { apr: string }) {
  return <P className="mr-3 text-xs text-[--primary-color]">APR: {apr}</P>
}

export type PressableState = Readonly<{
  hovered?: boolean
}>

type BeatListEntryProps = {
  entry: Entry
  spot?: number
  playlist?: Entry[]
}

export function BeatListEntry({
  entry,
  spot,
  playlist = [],
}: BeatListEntryProps) {
  const { push } = useRouter()

  const handlePress = () => {
    push(`/beat/${entry.id}`)
  }

  // Format TVL in lumens and APR values to match legacy app styling
  const tvlFormatted = entry.tvl ? stroopsToLumens(entry.tvl) : '0'
  const aprFormatted = entry.apr ? `${Math.round(entry.apr)}%` : '0%'

  return (
    <Pressable onPress={handlePress} className="flex">
      {({ hovered }: PressableState) => (
        <View
          className="flex flex-row items-center py-2 border-b border-[--border-color]"
          style={{ borderBottomWidth: 0.5 }}
        >
          {/* Album artwork */}
          <View className="aspect-[2/2] w-12 object-cover">
            <SolitoImage
              src={imageUrlSmall(entry.imageUrl)}
              alt={entry.title || ''}
              contentFit="cover"
              fill
              sizes="4rem"
              style={{ borderRadius: 6 }}
            />
          </View>

          {/* Rank number */}
          {spot && (
            <P className="ml-2 w-8 text-center text-2xl leading-none">{spot}</P>
          )}

          {/* Title and artist */}
          <View className="ml-2 flex flex-1 justify-center pr-2">
            <P numberOfLines={1} className="text-sm font-bold leading-6">
              {entry.title}
            </P>
            <P
              numberOfLines={1}
              className="text-xs leading-6 text-[--text-secondary-color]"
            >
              {entry.artist}
            </P>

            {/* Mobile TVL and APR */}
            {entry.tvl && entry.apr ? (
              <Pressable
                className="flex flex-row items-center md:hidden"
                onPress={() => push(`/beat/${entry.id}`)}
              >
                <View className="mr-3 flex flex-row items-center">
                  <Stellar size={10} color="var(--primary-color)" />
                  <P className="ml-1 text-xs leading-6">{tvlFormatted}</P>
                </View>
                <APRText apr={aprFormatted} />
              </Pressable>
            ) : null}
          </View>

          {/* Right side actions */}
          <View className="flex flex-row items-center">
            {/* Desktop TVL and APR */}
            {entry.tvl && entry.apr ? (
              <Pressable
                className="hidden flex-row items-center md:flex"
                onPress={() => push(`/beat/${entry.id}`)}
              >
                <APRText apr={aprFormatted} />
              </Pressable>
            ) : null}

            {/* <DownloadBtn size={14} className="mr-3" entry={entry} /> */}

            {/* Like button */}
            <LikeButton size={20} entry={entry} />

            {/* More options dots */}
            <Pressable onPress={() => push(`/beat/${entry.id}`)}>
              <VerticalDots size={24} className="stroke-[--text-color]" />
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  )
}
