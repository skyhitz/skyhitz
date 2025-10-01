'use client'
/**
 * Player slider component for seeking through tracks
 * Migrated from legacy implementation to use Zustand
 */
import { View } from 'react-native'
import { Slider } from 'app/design/slider'
import { P } from 'app/design/typography'
import { usePlayerStore } from 'app/state/player'

type Props = {
  className?: string
}

const formatSeconds = (seconds: number) => {
  if (seconds === 0) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`
}

export function PlayerSlider({ className = '' }: Props) {
  const {
    position,
    positionProgress,
    duration,
    setSeeking,
    seekTo,
    setPositionProgress,
    isReady,
  } = usePlayerStore()

  const handleStartSeeking = () => {
    setSeeking()
  }

  const handleSeekChange = (value: number) => {
    setPositionProgress(value)
  }

  const handleSeekCompleted = (value: number) => {
    console.log('Seek completed:', value)
    seekTo(value)
  }

  return (
    <View
      className={`flex flex-row items-center justify-between px-3 ${className}`}
    >
      <P className="text-xs mx-2">{formatSeconds(position)}</P>
      <Slider
        minimumValue={0}
        maximumValue={1}
        value={positionProgress}
        onSlidingStart={handleStartSeeking}
        onSlidingComplete={handleSeekCompleted}
        onValueChange={handleSeekChange}
        disabled={!isReady}
      />
      <P className="text-xs mx-2">{formatSeconds(duration)}</P>
    </View>
  )
}
