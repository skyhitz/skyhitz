'use client'
/**
 * Player slider component for seeking through tracks
 * Migrated from legacy implementation to use Zustand
 */
import { View } from 'react-native'
import { Slider } from 'app/design/slider'
import { usePlayback } from 'app/hooks/usePlayback'
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
  const { position, duration } = usePlayerStore()
  const { startSeeking, onSeekCompleted } = usePlayback()

  const positionSeconds = position / 1000
  const durationSeconds = duration / 1000

  return (
    <View
      className={`flex flex-row items-center justify-between px-3 ${className}`}
    >
      <P className="text-xs mx-2">{formatSeconds(positionSeconds)}</P>
      <Slider
        minimumValue={0}
        maximumValue={duration || 1}
        value={position}
        onSlidingStart={startSeeking}
        onSlidingComplete={onSeekCompleted}
      />
      <P className="text-xs mx-2">{formatSeconds(durationSeconds)}</P>
    </View>
  )
}
