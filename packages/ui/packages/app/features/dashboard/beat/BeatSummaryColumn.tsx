import { Entry, EntryHolder } from 'app/api/graphql'
import { Pressable, View, Platform } from 'react-native'
import InfoCircle from 'app/ui/icons/info-circle'
import { usePlayback } from 'app/hooks/usePlayback'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'
import LikeButton from 'app/ui/buttons/likeButton'
import { CollapsableView } from 'app/ui/CollapsableView'
import { LikesList } from 'app/features/player/components/likesList'
import { ShareButton } from 'app/ui/buttons/ShareButton'
import { Config } from 'app/config'
import { useRecoilValue } from 'recoil'
import { ActivityIndicator, H1, P } from 'app/design/typography'
import { entryAtom, playbackStateAtom } from 'app/state/player'
import { CreateBid } from './bids/CreateBid'
import DownloadBtn from 'app/ui/buttons/DownloadBtn'

type Props = {
  entry: Entry
  holders?: EntryHolder[] | null
}

export function BeatSummaryColumn({ entry }: Props) {
  return (
    <View className="flex w-full md:ml-4 md:flex-1">
      <View>
        <H1 className="font-unbounded mb-2 text-3xl font-bold md:text-5xl">
          {entry.title}
        </H1>
        <P className="md:text-2xl">{entry.artist}</P>
        <View className="mt-4 flex-row items-center gap-4">
          <PlayBeatButton currentEntry={entry} />
          <LikeButton size={24} entry={entry} />
          <ShareButton
            url={`${Config.APP_URL}/dashboard/beat/${entry.id}`}
            title="Share this beat!"
          />
          <DownloadBtn className="mb-0.5" size={20} entry={entry} />
        </View>
      </View>
      <CreateBid entry={entry} />

      <CollapsableView icon={InfoCircle} headerText="Description">
        <P className="p-5 text-sm leading-6">{entry.description}</P>
      </CollapsableView>
      <LikesList entry={entry} />
    </View>
  )
}

function PlayBeatButton({ currentEntry }: { currentEntry: Entry }) {
  const { playEntry, playPause } = usePlayback()
  const playbackState = useRecoilValue(playbackStateAtom)
  const entry = useRecoilValue(entryAtom)

  if (entry?.id === currentEntry.id) {
    if (playbackState === 'LOADING' || playbackState === 'FALLBACK') {
      return <ActivityIndicator grey />
    }

    return (
      <Pressable onPress={playPause}>
        {playbackState === 'PLAYING' ? (
          <PauseIcon className="text-gray-600" size={22} />
        ) : (
          <PlayIcon className="text-gray-600" size={22} />
        )}
      </Pressable>
    )
  }

  return (
    <Pressable onPress={() => playEntry(currentEntry, [currentEntry])}>
      <PlayIcon className="text-gray-600" />
    </Pressable>
  )
}
