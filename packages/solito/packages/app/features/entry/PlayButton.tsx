'use client'
import { Entry } from 'app/api/graphql/types'
import { usePlayback } from 'app/hooks/usePlayback';
import { PlaybackState, usePlayerStore } from 'app/state/player';
import { PlayPauseButton } from 'app/ui/buttons/PlayPauseButton';

interface PlayButtonProps {
  entry: Entry
  playlist?: Entry[]
}

export function PlayButton({ entry, playlist = [entry] }: PlayButtonProps) {
  const { playEntry, playPause, entry: currentEntry } = usePlayback();
  const { playbackState, shouldPlay } = usePlayerStore();
  
  const isCurrentEntry = currentEntry?.id === entry.id;
  
  // Only show playing state if this specific entry is playing
  const isPlaying = isCurrentEntry && (
    playbackState === PlaybackState.PLAYING ||
    (playbackState === PlaybackState.SEEKING && shouldPlay)
  );

  const toggle = () => {
    if (isCurrentEntry) {
      // If this entry is already loaded, toggle play/pause
      playPause();
    } else {
      // If it's a different entry, play it
      playEntry(entry, playlist);
    }
  };

  return (
    <PlayPauseButton
      onPress={toggle}
      size={24}
      iconClassName="text-[--text-color]"
      isPlaying={isPlaying}
      showLoadingState={true}
    />
  );
}
