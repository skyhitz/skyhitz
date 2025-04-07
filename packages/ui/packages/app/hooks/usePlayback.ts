import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  AVPlaybackStatus,
} from 'expo-av'
import { useEffect } from 'react'
import {
  Entry,
  useInvestEntryMutation,
  useSetLastPlayedEntryMutation,
} from 'app/api/graphql'
import { isSome, lumensToStroops } from 'app/utils'
import { append, findIndex, init, last } from 'ramda'
import { videoSrc } from 'app/utils/entry'
import { useErrorReport } from 'app/hooks/useErrorReport'
import { useRecoilCallback, useRecoilState, useSetRecoilState } from 'recoil'
import { useUserAtomState } from 'app/state/user'
import {
  playbackUriAtom,
  entryAtom,
  playbackStateAtom,
  playingHistoryAtom,
  durationAtom,
  positionAtom,
  loopingAtom,
  playlistAtom,
  shuffleAtom,
} from 'app/state/player'
import { usePlabackInstance } from 'app/provider/playback'

export function usePlayback() {
  const { user } = useUserAtomState()
  const [setLastPlayedEntry] = useSetLastPlayedEntryMutation()
  const reportError = useErrorReport()
  const [playbackUri, setPlaybackUri] = useRecoilState(playbackUriAtom)
  const setEntry = useSetRecoilState(entryAtom)
  const [playingHistory, setPlayingHistory] = useRecoilState(playingHistoryAtom)
  const setPlaybackState = useSetRecoilState(playbackStateAtom)
  const setDuration = useSetRecoilState(durationAtom)
  const setPosition = useSetRecoilState(positionAtom)
  const [looping, setLooping] = useRecoilState(loopingAtom)
  const [playlist, setPlaylist] = useRecoilState(playlistAtom)
  const [shuffle, setShuffle] = useRecoilState(shuffleAtom)
  const {
    playbackRef,
    setPlayback,
    shouldPlayRef,
    setShouldPlay,
    timeoutIdRef,
    setTimeoutId,
  } = usePlabackInstance()

  const [invest] = useInvestEntryMutation()

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    })
  }, [])

  useEffect(() => {
    // play the last played entry
    if (
      playbackRef?.current &&
      getPlaybackState() === 'IDLE' &&
      user?.lastPlayedEntry
    ) {
      playEntry(user.lastPlayedEntry, [user.lastPlayedEntry], false)
    }
  }, [user])

  const getPlaybackState = useRecoilCallback(
    ({ snapshot: { getLoadable } }) =>
      () =>
        getLoadable(playbackStateAtom).getValue(),
  )

  const getCurrentEntry = useRecoilCallback(
    ({ snapshot: { getLoadable } }) =>
      () =>
        getLoadable(entryAtom).getValue(),
  )

  const resetPlayer = () => {
    setPlayback(null)
    setPlaybackState('IDLE')
    setEntry(null)
    setPlaybackUri('')
    setPlayingHistory([])
    setPlaylist([])
    setDuration(0)
    setPosition(0)
  }

  const loadBeat = async (
    entry: Entry,
    fallback = false,
    shouldPlayEntry = shouldPlayRef?.current,
  ) => {
    if (!isSome(entry.videoUrl)) return
    const videoUrl = videoSrc(entry.videoUrl, fallback)
    if (playbackRef?.current !== null) {
      if (!fallback) {
        setPlaybackState('LOADING')
        setEntry(entry)
        setDuration(0)
        setPosition(0)
        setPlayingHistory(append(entry, playingHistory))
      }

      await playbackRef?.current?.pauseAsync()
      await playbackRef?.current?.unloadAsync()
      setPlaybackUri(videoUrl)

      if (timeoutIdRef?.current) {
        clearTimeout(timeoutIdRef.current)
      }
      const id = setTimeout(() => {
        if (fallback) {
          setPlaybackState('ERROR')
          reportError(Error("Couldn't play that beat. Try Again!"))
          resetPlayer()
        } else {
          setPlaybackState('FALLBACK')
          loadBeat(entry, true)
        }
      }, 10000)
      setTimeoutId(id)

      const source = { uri: videoUrl }
      const initialStatus = {
        shouldPlay: shouldPlayEntry,
      }

      await playbackRef?.current?.loadAsync(source, initialStatus, true)

      clearTimeout(id)
      if (shouldPlayEntry) {
        await playbackRef?.current?.playAsync()
      } else {
        setPlaybackState('PAUSED')
      }

      if (user) {
        setLastPlayedEntry({ variables: { entryId: entry.id } })
      }
    }
  }

  const playEntry = async (
    newEntry: Entry,
    playlist: Entry[],
    shouldPlayEntry = true,
  ) => {
    setPlaylist(playlist)
    setShouldPlay(shouldPlayEntry)
    if (newEntry.id === getCurrentEntry()?.id) {
      // if the new entry is the same as the current one, just set position to 0
      await playbackRef?.current?.setStatusAsync({
        positionMillis: 0,
        shouldPlay: shouldPlayEntry,
      })
      return
    }
    await loadBeat(newEntry, false, shouldPlayEntry)
  }

  const playPause = async () => {
    const playbackState = getPlaybackState()
    if (playbackRef?.current === null) return
    if (playbackState === 'PLAYING') {
      setShouldPlay(false)
      setPlaybackState('PAUSED')
      await playbackRef?.current?.pauseAsync()
    } else if (playbackState === 'PAUSED') {
      setShouldPlay(true)
      setPlaybackState('PLAYING')
      await playbackRef?.current?.playAsync()
    }
  }

  const startSeeking = async () => {
    setPlaybackState('SEEKING')
    await playbackRef?.current?.pauseAsync()
  }

  const onSeekCompleted = async (value: number) => {
    setPosition(value)
    setPlaybackState('LOADING')
    await playbackRef?.current?.setStatusAsync({
      positionMillis: value,
      shouldPlay: shouldPlayRef?.current,
    })
    setPlaybackState(shouldPlayRef?.current ? 'PLAYING' : 'PAUSED')
  }

  const skipForward = async () => {
    const currentIndex = findIndex(
      (item) => item?.id === getCurrentEntry()?.id,
      playlist,
    )
    if (currentIndex < 0) return
    let nextIndex: number
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = (currentIndex + 1) % playlist.length
    }
    setPlaybackState('PAUSED')
    await playbackRef?.current?.pauseAsync()
    const nextEntry = playlist[nextIndex]

    if (nextEntry) {
      await loadBeat(nextEntry)
    }
  }

  const onDidJustFinish = async () => {
    const entry = getCurrentEntry()
    if (user) {
      await invest({
        variables: {
          id: entry?.id!,
          amount: lumensToStroops(0.1),
        },
      })
    }
  }

  const skipBackward = async () => {
    const previousEntry = last(init(playingHistory))
    if (previousEntry === undefined) {
      await playbackRef?.current?.setStatusAsync({
        positionMillis: 0,
        shouldPlay: shouldPlayRef?.current,
      })
      return
    }
    setPlaybackState('PAUSED')
    await playbackRef?.current?.pauseAsync()
    await loadBeat(previousEntry)
    setPlayingHistory(init(playingHistory))
  }

  const toggleLoop = async () => {
    await playbackRef?.current?.setIsLoopingAsync(!looping)
    setLooping(!looping)
  }

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return
    }

    if (status.isBuffering && getPlaybackState() !== 'LOADING') {
      setPlaybackState('LOADING')
    }
    if (status.isPlaying && getPlaybackState() !== 'PLAYING') {
      setPlaybackState('PLAYING')
    }

    if (status.didJustFinish && getPlaybackState() === 'PLAYING' && !looping) {
      skipForward()
      onDidJustFinish()
    }

    if (status.durationMillis && !isNaN(status.durationMillis)) {
      setDuration(status.durationMillis)
    }

    if (
      status.positionMillis &&
      !isNaN(status.positionMillis) &&
      getPlaybackState() === 'PLAYING'
    ) {
      setPosition(status.positionMillis)
    }
  }

  const onReadyForDisplay = async () => {
    const playbackState = getPlaybackState()

    if (playbackState === 'LOADING' || playbackState === 'FALLBACK') {
      if (timeoutIdRef?.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (shouldPlayRef?.current) {
        setPlaybackState('PLAYING')
        await playbackRef?.current?.playAsync()
      } else {
        setPlaybackState('PAUSED')
      }
    }
  }

  const onError = (error: string) => {
    const playbackState = getPlaybackState()
    const entry = getCurrentEntry()

    console.error(error)
    if (timeoutIdRef?.current) {
      clearTimeout(timeoutIdRef?.current)
    }
    if (playbackState === 'FALLBACK' || !entry) {
      setPlaybackState('ERROR')
      reportError(Error("Couldn't play that beat. Try Again!"))
      resetPlayer()
    } else {
      setPlaybackState('FALLBACK')
      if (entry) {
        loadBeat(entry, true)
      }
    }
  }

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
    resetPlayer,
    playbackUri,
  }
}
