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
    <View className={`flex w-full items-center px-3 py-3 ${className}`}>
      <View className="flex w-full flex-row items-center justify-between">
        <P className="text-xs text-gray-600">
          {formatSeconds(positionSeconds)}
        </P>
        <P className="text-xs text-gray-600">
          {formatSeconds(durationSeconds)}
        </P>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={duration || 1}
        value={position}
        onSlidingStart={startSeeking}
        onSlidingComplete={onSeekCompleted}
        minimumTrackTintColor="#2060F6"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#2060F6"
        style={{ width: '100%', height: 40 }}
      />
    </View>
  )
}
