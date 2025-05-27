/**
 * usePlayback hook for managing media playback
 * Using Zustand store for state management
 */
import { useEffect } from 'react'
import { Entry } from 'app/api/graphql/types'

import { lumensToStroops, isSome } from 'app/utils'
import { append, findIndex, init, last } from 'ramda'
import { videoSrc } from 'app/utils/entry'
import { useErrorReport } from 'app/hooks/useErrorReport'
import { useUserStore } from 'app/state/user'
import { usePlayerStore } from 'app/state/player'
import { INVEST_ENTRY, SET_LAST_PLAYED_ENTRY } from 'app/api/graphql/operations'
import { useMutation } from '@apollo/client'

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
    looping,
    shuffle,
    shouldPlay,
    timeoutId,
    setEntry,
    setPlaybackUri,
    setPlaybackState,
    setDuration,
    setPosition,
    setLooping,
    setShuffle,
    setPlayingHistory,
    setPlaylist,
    setShouldPlay,
    setTimeoutId,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    resetPlayer,
  } = usePlayerStore()

  // GraphQL mutations
  const [setLastPlayedEntry] = useMutation(SET_LAST_PLAYED_ENTRY)
  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const reportError = useErrorReport()

  // We don't need an initialization effect anymore as the PlaybackProvider handles this
  // This prevents multiple initializations when the hook is used in multiple components

  // Play the last played entry when user data is loaded
  // useEffect(() => {
  //   // play the last played entry
  //   if (
  //     // playbackRef is removed; rely on context state
  //     playbackState === 'IDLE' &&
  //     user?.lastPlayedEntry
  //   ) {
  //     playEntry(user.lastPlayedEntry, [user.lastPlayedEntry], false)
  //   }
  // }, [user, playbackState]) // Added playbackState to dependency array as it's used and good practice

  // Reset player completely
  const resetPlayerState = () => {
    // Use the resetPlayer function from the Zustand store
    resetPlayer()
  }

  // Load a beat/track
  const loadBeat = async (
    entry: Entry,
    fallback = false,
    shouldPlayTrack = shouldPlay
  ) => {
    if (!isSome(entry.videoUrl)) return
    const videoUrl = videoSrc(entry.videoUrl, fallback)

    try {
      if (!fallback) {
        setPlaybackState('LOADING')
        setEntry(entry)
        setDuration(0)
        setPosition(0)
        setPlayingHistory(append(entry, playingHistory))
      }

      // Pause any current playback
      pauseAudio()
      setPlaybackUri(videoUrl)

      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Set a timeout to handle fallback or error cases
      const id = setTimeout(() => {
        // No need to set playback state here as resumeAudio already does it
      }, 10000)
      setTimeoutId(id as unknown as NodeJS.Timeout)

      // Play the audio if requested
      if (shouldPlayTrack) {
        playAudio(videoUrl)
      } else {
        setPlaybackState('PAUSED')
      }

      // Clear the timeout once we're done
      clearTimeout(id)

      // Update the user's last played entry
      if (user) {
        setLastPlayedEntry({ variables: { entryId: entry.id } })
      }
    } catch (error) {
      console.error('[loadBeat] Error playing audio:', error)
      setPlaybackState('ERROR')
      reportError(Error("Couldn't play that beat. Try Again!"))
    }
  }

  // Play an entry
  const playEntry = async (
    newEntry: Entry,
    playlist: Entry[],
    shouldPlayTrack = true
  ) => {
    setPlaylist(playlist)
    setShouldPlay(shouldPlayTrack)

    if (newEntry.id === entry?.id) {
      // If the new entry is the same as the current one, just set position to 0
      setPosition(0) // Update position in state

      if (shouldPlayTrack) {
        // Get the video URL and play it
        const videoUrl = videoSrc(newEntry.videoUrl || '', false)
        playAudio(videoUrl)
      }
    } else {
      // Otherwise load the new entry
      await loadBeat(newEntry, false, shouldPlayTrack)
    }
  }

  // Toggle play/pause
  const playPause = async () => {
    // If nothing is loaded, return
    console.log(
      '[usePlayback] playPause called, current state:',
      playbackState,
      'URI:',
      playbackUri
    )

    // If we have a video URL but we're in IDLE state, we need to initialize the player
    if (playbackState === 'IDLE' && playbackUri) {
      console.log('[usePlayback] Initializing player from IDLE state')
      setShouldPlay(true)
      setPlaybackState('LOADING')

      try {
        // Play the audio immediately
        playAudio(playbackUri)
        console.log(
          '[usePlayback] Successfully started playback from IDLE state'
        )
      } catch (error) {
        console.error('[usePlayback] Error starting playback:', error)
        setPlaybackState('ERROR')
      }
      return
    }

    // Regular play/pause logic for active player
    if (!playbackUri) {
      console.log('[usePlayback] No playback URI available')
      return
    }

    if (playbackState === 'PLAYING') {
      console.log('[usePlayback] Pausing playback')
      pauseAudio()
    } else if (playbackState === 'PAUSED') {
      console.log('[usePlayback] Resuming playback')
      resumeAudio()
      setPlaybackState('PLAYING')
      resumeAudio()
    } else if (playbackState === 'ERROR') {
      console.log('[usePlayback] Attempting to recover from error')

      if (entry) {
        // Try to reload the current entry
        loadBeat(entry, false, true)
      } else if (playbackUri) {
        // If we have a URI but no entry, just try to play it directly
        setShouldPlay(true)
        playAudio(playbackUri)
      }
    }
  }

  // Start seeking
  const startSeeking = async () => {
    setPlaybackState('SEEKING')
    // Use pauseAudio from the top level of the hook
    // pauseAudio()
  }

  // Handle seek completion
  const onSeekCompleted = async (value: number) => {
    setPosition(value)
    setPlaybackState('LOADING')

    // Update our state with the new position
    setPosition(value)

    // If we should be playing, resume playback
    if (shouldPlay && playbackUri) {
      playAudio(playbackUri)
    }

    setPlaybackState(shouldPlay ? 'PLAYING' : 'PAUSED')
  }

  // Skip to next track
  const skipForward = async () => {
    const currentIndex = findIndex((item) => item?.id === entry?.id, playlist)
    if (currentIndex < 0) return
    let nextIndex: number
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = (currentIndex + 1) % playlist.length
    }
    setPlaybackState('PAUSED')

    // Use the pauseAudio function from the Zustand store
    pauseAudio()

    const nextEntry = playlist[nextIndex]

    if (nextEntry) {
      await loadBeat(nextEntry)
    }
  }

  // Handle track completion and investing
  const onDidJustFinish = async () => {
    if (!entry || !user) return

    await invest({
      variables: {
        id: entry.id,
        amount: lumensToStroops(0.1),
      },
    })
  }

  // Skip to previous track
  const skipBackward = async () => {
    const previousEntry = last(init(playingHistory))
    if (previousEntry === undefined) {
      // Just reset position to start of track
      setPosition(0)

      if (shouldPlay && playbackUri) {
        // Use playAudio from the Zustand store
        playAudio(playbackUri)
      }
      return
    }

    setPlaybackState('PAUSED')
    // Use pauseAudio from the Zustand store
    pauseAudio()

    await loadBeat(previousEntry)
    setPlayingHistory(init(playingHistory))
  }

  // Toggle looping
  const toggleLoop = async () => {
    // In our platform-agnostic implementation, we just maintain loop state
    // The actual implementation would be handled in the platform-specific code
    setLooping(!looping)
  }

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
    if (!status.isLoaded) {
      return
    }

    if (status.isBuffering && playbackState !== 'LOADING') {
      setPlaybackState('LOADING')
    }
    if (status.isPlaying && playbackState !== 'PLAYING') {
      setPlaybackState('PLAYING')
    }

    if (status.didJustFinish && playbackState === 'PLAYING' && !looping) {
      skipForward()
      onDidJustFinish()
    }

    if (status.durationMillis && !isNaN(status.durationMillis)) {
      setDuration(status.durationMillis)
    }

    if (
      status.positionMillis &&
      !isNaN(status.positionMillis) &&
      playbackState === 'PLAYING'
    ) {
      setPosition(status.positionMillis)
    }
  }

  // Handle when video is ready to display
  const onReadyForDisplay = async () => {
    if (playbackState === 'LOADING' || playbackState === 'FALLBACK') {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (shouldPlay && playbackUri) {
        // Use resumeAudio from the Zustand store
        resumeAudio()
      } else {
        setPlaybackState('PAUSED')
      }
    }
  }

  // Handle errors
  const onError = (error: string) => {
    console.error(error)
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (playbackState === 'FALLBACK' || !entry) {
      setPlaybackState('ERROR')
      reportError(Error("Couldn't play that beat. Try Again!"))
      resetPlayerState()
    } else {
      setPlaybackState('FALLBACK')
      if (entry) {
        loadBeat(entry, true)
      }
    }
  }

  // Toggle shuffle
  const toggleShuffle = () => setShuffle(!shuffle)

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
