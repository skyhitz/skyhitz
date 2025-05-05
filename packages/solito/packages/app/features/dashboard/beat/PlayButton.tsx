'use client'
import { Entry } from 'app/api/graphql/types'
import { videoSrc } from 'app/utils/entry'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import PlayIcon from 'app/ui/icons/play'
import { H3, P } from 'app/design/typography'

interface PlayButtonProps {
  entry: Entry
}

export function PlayButton({ entry }: PlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoUrl = videoSrc(entry.videoUrl)

  useEffect(() => {
    // Initialize audio element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(videoUrl)
      audioRef.current.preload = 'metadata'
      
      // Event listeners
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
      })
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.removeEventListener('ended', () => {
            setIsPlaying(false)
          })
        }
      }
    }
  }, [videoUrl])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }, [isPlaying])

  return (
    <View className="mb-4">
      <Pressable
        onPress={togglePlay}
        className="flex flex-row items-center justify-center rounded-full bg-cyan-500 px-6 py-3"
      >
        <PlayIcon className="mr-2" fill={isPlaying ? 'white' : 'white'} />
        <P className="font-semibold text-white">{isPlaying ? 'Pause' : 'Play'}</P>
      </Pressable>
      <View className="mt-2">
        <H3 className="text-lg font-bold">{entry.title}</H3>
        {entry.artist && (
          <P className="text-sm text-gray-400">{entry.artist}</P>
        )}
      </View>
    </View>
  )
}
