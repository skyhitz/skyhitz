/**
 * usePlayback hook for managing media playback
 * Using Zustand store for state management
 */
import { Entry } from 'app/api/graphql/types'

import { lumensToStroops } from 'app/utils'
import { MICRO_SPEND_PLAYBACK_COMPLETE_XLM } from 'app/constants/constants'
import { last } from 'ramda'
import { videoSrc } from 'app/utils/entry'
import { useErrorReport } from 'app/hooks/useErrorReport'
import { useUserStore } from 'app/state/user'
import { PlaybackState, usePlayerStore } from 'app/state/player'
import { INVEST_ENTRY, SET_LAST_PLAYED_ENTRY } from 'app/api/graphql/operations'
import { useMutation } from '@apollo/client'
import { useEffect } from 'react'

export function usePlayback() {
  // Get user data
  const { user } = useUserStore()

  // Get player state and functions from Zustand store
  const {
    entry,
    playbackState,
    playingHistory,
    playlist,
    setEntry,
    setPlaybackState,
    play,
    pause,
    resume,
  } = usePlayerStore()

  // GraphQL mutations
  const [setLastPlayedEntry] = useMutation(SET_LAST_PLAYED_ENTRY)
  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const reportError = useErrorReport()


  // Load a beat/track
  const loadEntry = async (entry: Entry, fallback = false) => {
    console.log('[usePlayback] Loading entry', entry.id)
    if (!entry.videoUrl) return;

    const videoUrl = videoSrc(entry.videoUrl, fallback);
    setEntry(entry);

    if (user) {
      setLastPlayedEntry({ variables: { entryId: entry.id } });
    }

    // Call play with the URL, which will handle playing
    await play(videoUrl);
  };

  // Play an entry
  const playEntry = async (newEntry: Entry, playlist: Entry[], shouldPlayTrack = true) => {
    console.log('[usePlayback] Playing entry', newEntry.id)
    usePlayerStore.getState().setPlaylist(playlist);

    if (newEntry.id === entry?.id) {
      usePlayerStore.getState().seekTo(0);
      if (shouldPlayTrack) await resume();
      return;
    }

    // Load the new entry
    await loadEntry(newEntry, false);
  };

  const isPlaying = playbackState === 'PLAYING'
  const isLoading = playbackState === 'LOADING'
  const hasMedia = playbackState !== 'IDLE'

  // Handle play/pause toggle
  const playPause = async () => {
    if (isPlaying) {
      console.log('[usePlayback] Pausing playback')
      await pause()
    } else if (hasMedia) {
      console.log('[usePlayback] Resuming playback')
      await resume()
    } 
  }

  // Start seeking
  const startSeeking = async () => {
    setPlaybackState(PlaybackState.SEEKING);
  };

  // Handle seek completion
  const onSeekCompleted = async (fraction: number) => {
  };

  // Skip to next track
  const skipForward = async () => {
    const currentIndex = playlist.findIndex((item) => item?.id === entry?.id);
    if (currentIndex < 0) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextEntry = playlist[nextIndex];

    if (nextEntry) {
      await playEntry(nextEntry, playlist);
    }
  };

  // Handle track completion and investing
  const onDidJustFinish = async () => {
    if (!entry || !user) return;

    await invest({
      variables: {
        id: entry.id,
        amount: lumensToStroops(MICRO_SPEND_PLAYBACK_COMPLETE_XLM),
      },
    });
  };

  // Skip to previous track
  const skipBackward = async () => {
    const previousEntry = last(playingHistory.slice(0, -1));
    if (!previousEntry) {
      usePlayerStore.getState().seekTo(0);
      return;
    }

    await playEntry(previousEntry, playlist);
    usePlayerStore.getState().setPlayingHistory(playingHistory.slice(0, -1));
  };

  // Toggle looping
  const toggleLoop = () => {
    usePlayerStore.getState().toggleLoop();
  };

  // Handle playback status updates with our platform-agnostic approach
  // Instead of relying on AVPlaybackStatus, we'll use our own status object
  interface PlaybackStatus {
    isLoaded?: boolean
    isBuffering?: boolean
    isPlaying?: boolean
    didJustFinish?: boolean
    durationMillis?: number
    positionMillis?: number
  }

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
  }

  // Handle when video is ready to display
  const onReadyForDisplay = async () => {
  }

  // Handle errors
  const onError = (error: string) => {
    console.error(error);
    reportError(new Error("Couldn't play that beat. Try Again!"));
    setPlaybackState(PlaybackState.ERROR);
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    // Implement if needed
  };

  // Add useEffect for handling ENDED state
  useEffect(() => {
    if (playbackState === PlaybackState.ENDED && !usePlayerStore.getState().loop) {
      onDidJustFinish();
      skipForward();
    }
  }, [playbackState]);

  return {
    // Player control functions
    playEntry,
    playPause,
    startSeeking,
    onSeekCompleted,
    skipForward,
    skipBackward,
    toggleLoop,
    toggleShuffle,

    // Event handlers
    onPlaybackStatusUpdate,
    onReadyForDisplay,
    onError,

    // State and utilities
    entry,
    playbackState,
  }
}
