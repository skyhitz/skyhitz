'use client'
import { Entry } from 'app/api/graphql/types'
import { P } from 'app/design/typography'
import { imageUrlSmall } from 'app/utils/entry'
import { useRouter } from 'app/navigation'
import { SolitoImage } from 'app/design/solito-image'
import { MoreVertical } from '@tamagui/lucide-icons'
import LikeButton from 'app/ui/buttons/likeButton'
// import DownloadBtn from 'app/ui/buttons/download'
import Stellar from 'app/ui/icons/stellar'
import { stroopsToLumens } from 'app/utils/stroopsToLumens'
import { usePlayback } from 'app/hooks/usePlayback'
import { XStack, YStack, Button } from 'tamagui'

// Reusable component for APR text with consistent styling
function APRText({ apr }: { apr: string }) {
  return <P marginRight="$3" fontSize="$2" color="$blue9">APR: {apr}</P>
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
  const { playEntry } = usePlayback()

  const handlePress = () => {
    console.log('[BeatListEntry] Pressed entry', entry.id)
    playEntry(entry, playlist)
  }

  // Format TVL in lumens and APR values to match legacy app styling
  const tvlFormatted = entry.tvl ? stroopsToLumens(entry.tvl) : '0'
  const aprFormatted = entry.apr ? `${Math.round(entry.apr)}%` : '0%'

  return (
    <Button
      onPress={handlePress}
      backgroundColor="transparent"
      padding="$0"
      flexDirection="row"
      alignItems="center"
      paddingVertical="$2"
      borderBottomWidth={0.5}
      borderBottomColor="$borderColor"
    >
      {/* Album artwork */}
      <YStack
        aspectRatio={1}
        width={48}
        overflow="hidden"
      >
        <SolitoImage
          src={imageUrlSmall(entry.imageUrl)}
          alt={entry.title || ''}
          contentFit="cover"
          fill
          sizes="4rem"
          style={{ borderRadius: 6 }}
        />
      </YStack>

      {/* Rank number */}
      {spot && (
        <P
          marginLeft="$2"
          width={32}
          textAlign="center"
          fontSize="$8"
          lineHeight="$2"
        >
          {spot}
        </P>
      )}

      {/* Title and artist */}
      <YStack
        marginLeft="$2"
        flex={1}
        justifyContent="center"
        paddingRight="$2"
      >
        <P
          numberOfLines={1}
          fontSize="$3"
          fontWeight="bold"
          lineHeight="$6"
        >
          {entry.title}
        </P>
        <P
          numberOfLines={1}
          fontSize="$2"
          lineHeight="$6"
          color="$gray10"
        >
          {entry.artist}
        </P>

        {/* Mobile TVL and APR */}
        {entry.tvl && entry.apr ? (
          <Button
            flexDirection="row"
            alignItems="center"
            md={{ display: 'none' }}
            backgroundColor="transparent"
            padding="$0"
            onPress={() => push(`/music/${entry.id}`)}
          >
            <XStack marginRight="$3" flexDirection="row" alignItems="center">
              <Stellar size={10} color="$blue9" />
              <P marginLeft="$1" fontSize="$2" lineHeight="$6">{tvlFormatted}</P>
            </XStack>
            <APRText apr={aprFormatted} />
          </Button>
        ) : null}
      </YStack>

      {/* Right side actions */}
      <XStack flexDirection="row" alignItems="center">
        {/* Desktop TVL and APR */}
        {entry.tvl && entry.apr ? (
          <Button
            display={{ xs: 'none', md: 'flex' }}
            flexDirection="row"
            alignItems="center"
            backgroundColor="transparent"
            padding="$0"
            onPress={() => push(`/music/${entry.id}`)}
          >
            <APRText apr={aprFormatted} />
          </Button>
        ) : null}

        {/* <DownloadBtn size={14} marginRight="$3" entry={entry} /> */}

        {/* Like button */}
        <LikeButton size={20} entry={entry} />

        {/* More options dots */}
        <Button
          backgroundColor="transparent"
          padding="$0"
          onPress={() => push(`/music/${entry.id}`)}
        >
          <MoreVertical size={24} color="$color12" />
        </Button>
      </XStack>
    </Button>
  )
}
