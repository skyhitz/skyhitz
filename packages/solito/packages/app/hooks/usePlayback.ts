/**
 * usePlayback hook for managing media playback
 * Using Zustand store for state management
 */
import { Entry } from 'app/api/graphql/types'

import { lumensToStroops, isSome } from 'app/utils'
import { append, findIndex, init, last } from 'ramda'
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
    playbackUri,
    playbackState,
    playingHistory,
    playlist,
    // looping,
    // shuffle,
    // shouldPlay,
    // timeoutId,
    setEntry,
    setPlaybackUri,
    setPlaybackState,
    // setDuration,
    // setPosition,
    // setLooping,
    // setShuffle,
    // setPlayingHistory,
    // setPlaylist,
    // setShouldPlay,
    // setTimeoutId,
    // playAudio,
    // pauseAudio,
    // resumeAudio,
    // stopAudio,
    // resetPlayer,
    play,
    pause,
    resume,
  } = usePlayerStore()

  // GraphQL mutations
  const [setLastPlayedEntry] = useMutation(SET_LAST_PLAYED_ENTRY)
  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const reportError = useErrorReport()

  // We don't need an initialization effect anymore as the PlaybackProvider handles this
  // This prevents multiple initializations when the hook is used in multiple components

  // Play the last played entry when user data is loaded
  useEffect(() => {
    if (playbackState === PlaybackState.IDLE && user?.lastPlayedEntry) {
      playEntry(user.lastPlayedEntry, [user.lastPlayedEntry], false);
    }
  }, [user, playbackState]);

  // Reset player completely
  const resetPlayerState = () => {
    // Use the resetPlayer function from the Zustand store
    // resetPlayer()
  }

  // Load a beat/track
  const loadBeat = async (entry: Entry, fallback = false) => {
    if (!entry.videoUrl) return;

    const videoUrl = videoSrc(entry.videoUrl, fallback);

    setEntry(entry);
    setPlaybackUri(videoUrl);
    setPlaybackState(PlaybackState.LOADING);

    if (user) {
      setLastPlayedEntry({ variables: { entryId: entry.id } });
    }

    // Call play with the URL, which will handle playing
    await play(videoUrl);
  };

  // Play an entry
  const playEntry = async (newEntry: Entry, playlist: Entry[], shouldPlayTrack = true) => {
    usePlayerStore.getState().setPlaylist(playlist);

    if (newEntry.id === entry?.id) {
      usePlayerStore.getState().seekTo(0);
      if (shouldPlayTrack) await resume();
      return;
    }

    // Load the new entry
    await loadBeat(newEntry, false);
  };

  const isPlaying = playbackState === 'PLAYING'
  const isLoading = playbackState === 'LOADING'
  const hasMedia = playbackState !== 'IDLE'

  // Handle play/pause toggle
  const handlePlayPause = async () => {
    if (isPlaying) {
      console.log('[usePlayback] Pausing playback')
      await pause()
    } else if (hasMedia) {
      console.log('[usePlayback] Resuming playback')
      await resume()
    } 
  }

  // Toggle play/pause
  const playPause = async () => {
    handlePlayPause()
    // If nothing is loaded, return

    // // If we have a video URL but we're in IDLE state, we need to initialize the player
    // if (playbackState === 'IDLE' && playbackUri) {
    //   console.log('[usePlayback] Initializing player from IDLE state')
    //   setShouldPlay(true)
    //   setPlaybackState('LOADING')

    //   try {
    //     // Play the audio immediately
    //     playAudio(playbackUri)
    //     console.log(
    //       '[usePlayback] Successfully started playback from IDLE state'
    //     )
    //   } catch (error) {
    //     console.error('[usePlayback] Error starting playback:', error)
    //     setPlaybackState('ERROR')
    //   }
    //   return
    // }

    // // Regular play/pause logic for active player
    // if (!playbackUri) {
    //   console.log('[usePlayback] No playback URI available')
    //   return
    // }

    // if (playbackState === 'PLAYING') {
    //   console.log('[usePlayback] Pausing playback')
    //   pauseAudio()
    // } else if (playbackState === 'PAUSED') {
    //   console.log('[usePlayback] Resuming playback')
    //   resumeAudio()
    //   setPlaybackState('PLAYING')
    //   resumeAudio()
    // } else if (playbackState === 'ERROR') {
    //   console.log('[usePlayback] Attempting to recover from error')

    //   if (entry) {
    //     // Try to reload the current entry
    //     loadBeat(entry, false, true)
    //   } else if (playbackUri) {
    //     // If we have a URI but no entry, just try to play it directly
    //     setShouldPlay(true)
    //     playAudio(playbackUri)
    //   }
    // }

    // if (isPlaying) {
    //   await pause()
    // } else if (hasMedia) {
    //   await resume()
    // } else {
    //   // Example: play a test video if no media is loaded
    //   await play('https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8')
    // }
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
        amount: lumensToStroops(0.1),
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
    // if (!status.isLoaded) {
    //   return
    // }
    // if (status.isBuffering && playbackState !== 'LOADING') {
    //   setPlaybackState('LOADING')
    // }
    // if (status.isPlaying && playbackState !== 'PLAYING') {
    //   setPlaybackState('PLAYING')
    // }
    // if (status.didJustFinish && playbackState === 'PLAYING' && !looping) {
    //   skipForward()
    //   onDidJustFinish()
    // }
    // if (status.durationMillis && !isNaN(status.durationMillis)) {
    //   setDuration(status.durationMillis)
    // }
    // if (
    //   status.positionMillis &&
    //   !isNaN(status.positionMillis) &&
    //   playbackState === 'PLAYING'
    // ) {
    //   setPosition(status.positionMillis)
    // }
  }

  // Handle when video is ready to display
  const onReadyForDisplay = async () => {
    // if (playbackState === 'LOADING' || playbackState === 'FALLBACK') {
    //   if (timeoutId) {
    //     clearTimeout(timeoutId)
    //   }
    //   if (shouldPlay && playbackUri) {
    //     // Use resumeAudio from the Zustand store
    //     resumeAudio()
    //   } else {
    //     setPlaybackState('PAUSED')
    //   }
    // }
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
    resetPlayer: resetPlayerState,
    playbackUri,
    entry,
    playbackState,
  }
}
