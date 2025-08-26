'use client'
import { Entry } from 'app/api/graphql/types'
import { Pressable } from 'react-native'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'
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
    <Pressable onPress={toggle}>
      {isThisPlaying ? (
        <PauseIcon className="text-gray-600" size={24} stroke="var(--text-color)" />
      ) : (
        <PlayIcon className="text-gray-600" size={24} stroke="var(--text-color)" />
      )}
    </Pressable>
  );
}
