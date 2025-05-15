/**
 * usePlayback hook for managing media playback
 * Migrated from expo-av to platform-agnostic implementation
 */
import { useEffect } from 'react'
import { Entry } from 'app/api/graphql/types'

import { lumensToStroops, isSome } from 'app/utils'
import { append, findIndex, init, last } from 'ramda'
import { videoSrc } from 'app/utils/entry'
import { useErrorReport } from 'app/hooks/useErrorReport'
import { useUserStore } from 'app/state/user'
import { usePlayerStore } from 'app/state/player'
import { usePlaybackContext } from 'app/provider/playback'
import { INVEST_ENTRY, SET_LAST_PLAYED_ENTRY } from 'app/api/graphql/operations'
import { useMutation } from '@apollo/client'

export function usePlayback() {
  // Get user data
  const { user } = useUserStore()

  // Get player state
  const {
    entry,
    playbackUri,
    playbackState,
    playingHistory,
    playlist,
    looping,
    shuffle,
    setEntry,
    setPlaybackUri,
    setPlaybackState,
    setDuration,
    setPosition,
    setLooping,
    setShuffle,
    setPlayingHistory,
    setPlaylist,
    resetPlayer,
  } = usePlayerStore()

  // Get player instance references
  const {
    setPlayback,
    shouldPlayRef,
    setShouldPlay,
    timeoutIdRef,
    setTimeoutId,
  } = usePlaybackContext()

  // GraphQL mutations
  const [setLastPlayedEntry] = useMutation(SET_LAST_PLAYED_ENTRY)
  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const reportError = useErrorReport()

  // No need to set up audio mode with our platform-agnostic provider
  // This would be handled by the actual platform-specific implementation
  useEffect(() => {
    // Audio configuration is now handled by the PlaybackProvider
    console.log('[usePlayback] Initialized playback system')
  }, [])

  // Play the last played entry when user data is loaded
  useEffect(() => {
    // play the last played entry
    if (
      // playbackRef is removed; rely on context state
      playbackState === 'IDLE' &&
      user?.lastPlayedEntry
    ) {
      playEntry(user.lastPlayedEntry, [user.lastPlayedEntry], false)
    }
  }, [user])

  // Reset player completely
  const resetPlayerState = () => {
    setPlayback(null)
    setPlaybackState('IDLE')
    setEntry(null)
    setPlaybackUri('')
    setPlayingHistory([])
    setPlaylist([])
    setDuration(0)
    setPosition(0)
  }

  // Get playback context functions at the top level of the hook
  const { pauseAudio, playAudio } = usePlaybackContext()
  
  // Load a beat/track
  const loadBeat = async (
    entry: Entry,
    fallback = false,
    shouldPlayEntry = shouldPlayRef?.current
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

      // Use the playback functions from the context
      pauseAudio()
      setPlaybackUri(videoUrl)

      if (timeoutIdRef?.current) {
        clearTimeout(timeoutIdRef.current)
      }
      const id = setTimeout(() => {
        if (fallback) {
          setPlaybackState('ERROR')
          reportError(Error("Couldn't play that beat. Try Again!"))
          resetPlayerState()
        } else {
          setPlaybackState('FALLBACK')
          loadBeat(entry, true)
        }
      }, 10000)
      setTimeoutId(id as unknown as NodeJS.Timeout)

      // Play the audio using our platform-agnostic method
      if (shouldPlayEntry) {
        playAudio(videoUrl)
        setPlaybackState('PLAYING')
      } else {
        setPlaybackState('PAUSED')
      }

      clearTimeout(id)

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
    shouldPlayEntry = true
  ) => {
    setPlaylist(playlist)
    setShouldPlay(shouldPlayEntry)
    if (newEntry.id === entry?.id) {
      // if the new entry is the same as the current one, just set position to 0
      // Using our platform-agnostic PlaybackProvider
      setPosition(0) // Update position in state

      if (shouldPlayEntry) {
        const { playAudio } = usePlaybackContext()
        const videoUrl = videoSrc(newEntry.videoUrl || '', false)
        playAudio(videoUrl)
      }
    } else {
      // otherwise load the new entry
      await loadBeat(newEntry, false, shouldPlayEntry)
    }
  }

  // Toggle play/pause
  const playPause = async () => {
    // playbackRef is removed; rely on context state
    // If nothing is loaded, return
    if (!playbackUri) return
    if (playbackState === 'PLAYING') {
      setShouldPlay(false)
      setPlaybackState('PAUSED')
      const { pauseAudio } = usePlaybackContext()
      pauseAudio()
    } else if (playbackState === 'PAUSED') {
      setShouldPlay(true)
      setPlaybackState('PLAYING')
      const { resumeAudio } = usePlaybackContext()
      resumeAudio()
    }
  }

  // Start seeking
  const startSeeking = async () => {
    setPlaybackState('SEEKING')
    const { pauseAudio } = usePlaybackContext()
    pauseAudio()
  }

  // Handle seek completion
  const onSeekCompleted = async (value: number) => {
    setPosition(value)
    setPlaybackState('LOADING')

    // Update our state with the new position
    setPosition(value)

    // If we should be playing, resume playback
    if (shouldPlayRef?.current && playbackUri) {
      const { playAudio } = usePlaybackContext()
      playAudio(playbackUri)
    }

    setPlaybackState(shouldPlayRef?.current ? 'PLAYING' : 'PAUSED')
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

    // Use platform-agnostic method to pause
    const { pauseAudio } = usePlaybackContext()
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

      if (shouldPlayRef?.current && playbackUri) {
        const { playAudio } = usePlaybackContext()
        playAudio(playbackUri)
      }
      return
    }

    setPlaybackState('PAUSED')
    const { pauseAudio } = usePlaybackContext()
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
      if (timeoutIdRef?.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (shouldPlayRef?.current && playbackUri) {
        setPlaybackState('PLAYING')
        const { resumeAudio } = usePlaybackContext()
        resumeAudio()
      } else {
        setPlaybackState('PAUSED')
      }
    }
  }

  // Handle errors
  const onError = (error: string) => {
    console.error(error)
    if (timeoutIdRef?.current) {
      clearTimeout(timeoutIdRef?.current)
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
    setPlayback,
    playEntry,
    playPause,
    startSeeking,
    onSeekCompleted,
    skipForward,
    skipBackward,
    toggleLoop,
    toggleShuffle,
    onPlaybackStatusUpdate,
    onReadyForDisplay,
    onError,
    resetPlayer: resetPlayerState,
    playbackUri,
  }
}
