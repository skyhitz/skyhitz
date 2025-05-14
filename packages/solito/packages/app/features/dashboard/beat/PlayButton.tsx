'use client'
import { Entry } from 'app/api/graphql/types'
import { videoSrc } from 'app/utils/entry'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'

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
    <Pressable onPress={togglePlay}>
      {isPlaying ? (
        <PauseIcon
          className="text-gray-600"
          size={24}
          stroke="var(--text-color)"
        />
      ) : (
        <PlayIcon
          className="text-gray-600"
          size={24}
          stroke="var(--text-color)"
        />
      )}
    </Pressable>
  )
}
