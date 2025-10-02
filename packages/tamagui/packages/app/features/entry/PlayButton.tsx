'use client'
import { Entry } from 'app/api/graphql/types'
import { Button } from 'tamagui'
import { Play, Pause } from '@tamagui/lucide-icons'
import { usePlayback } from 'app/hooks/usePlayback';
import { PlaybackState } from 'app/state/player';

interface PlayButtonProps {
  entry: Entry
  playlist?: Entry[]
}

export function PlayButton({ entry, playlist = [entry] }: PlayButtonProps) {
  const { playEntry, playbackState, entry: currentEntry } = usePlayback();
  const isThisPlaying = currentEntry?.id === entry.id && playbackState === PlaybackState.PLAYING;

  const toggle = () => {
    playEntry(entry, playlist);
  };

  return (
    <Button onPress={toggle} backgroundColor="transparent" padding="$0">
      {isThisPlaying ? (
        <Pause size={24} color="$color" />
      ) : (
        <Play size={24} color="$color" />
      )}
    </Button>
  );
}
