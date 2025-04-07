import { Playback } from 'expo-av/build/AV'

import { MutableRefObject, createContext, useContext, useRef } from 'react'

type PlaybackContext = {
  playbackRef: MutableRefObject<Playback | null> | null
  shouldPlayRef: MutableRefObject<boolean> | null
  timeoutIdRef: MutableRefObject<
    ReturnType<typeof setTimeout> | undefined
  > | null
  setPlayback: (playback: Playback | null) => void
  setShouldPlay: (shouldPlay: boolean) => void
  setTimeoutId: (timeoutId: ReturnType<typeof setTimeout>) => void
}

export const PlaybackContext = createContext<PlaybackContext>({
  playbackRef: null,
  shouldPlayRef: null,
  timeoutIdRef: null,
  setPlayback: (playback) => {},
  setShouldPlay: (shouldPlay) => {},
  setTimeoutId: (timeoutId: ReturnType<typeof setTimeout>) => {},
})

const PlaybackProvider = ({ children }: { children: React.ReactNode }) => {
  const playbackRef = useRef<Playback | null>(null)
  const shouldPlayRef = useRef(false)
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | undefined>()

  const setPlayback = (val: Playback) => {
    playbackRef.current = val
  }

  const setShouldPlay = (val: boolean) => {
    shouldPlayRef.current = val
  }

  const setTimeoutId = (newTimeoutId: ReturnType<typeof setTimeout>) => {
    timeoutIdRef.current = newTimeoutId
  }

  const handleSetPlayback = (val: any) => {
    if (val && !playbackRef.current) {
      setPlayback(val)
    }
  }

  return (
    <PlaybackContext.Provider
      value={{
        playbackRef,
        setPlayback: handleSetPlayback,
        shouldPlayRef: shouldPlayRef,
        setShouldPlay,
        timeoutIdRef,
        setTimeoutId,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  )
}

export const usePlabackInstance = () => useContext(PlaybackContext)

export default PlaybackProvider
