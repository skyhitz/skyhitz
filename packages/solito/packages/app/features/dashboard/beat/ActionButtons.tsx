'use client'
import { Entry } from 'app/api/graphql/types'
import { useLikeEntry } from 'app/hooks/algolia/useLikeEntry'
import { videoSrc } from 'app/utils/entry'
import { useCallback } from 'react'
import { Pressable, View } from 'react-native'
import LikeIcon from 'app/ui/icons/like'
import ShareIcon from 'app/ui/icons/share'
import DownloadIcon from 'app/ui/icons/download'
import { P } from 'app/design/typography'
import { Platform } from 'react-native'
import { useUserStore } from 'app/state/user'
import { useToast } from 'app/provider/toast'

interface ActionButtonsProps {
  entry: Entry
}

export function ActionButtons({ entry }: ActionButtonsProps) {
  const user = useUserStore((state) => state.user)
  const toast = useToast()
  const { likeEntry, isLiked, toggleLikeLoading } = useLikeEntry(entry)

  const handleLike = useCallback(() => {
    if (!user) {
      toast.show('You need to be logged in to like this beat', { type: 'error' })
      return
    }
    likeEntry()
  }, [likeEntry, user, toast])

  const handleShare = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: entry.title,
          text: `Check out ${entry.title} on Skyhitz`,
          url: `https://skyhitz.io/dashboard/beat/${entry.id}`,
        })
        .catch((error) => console.error('Error sharing:', error))
    } else {
      // Fallback for platforms without navigator.share
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(`https://skyhitz.io/dashboard/beat/${entry.id}`)
        toast.show('URL copied to clipboard', { type: 'success' })
      }
    }
  }, [entry, toast])

  const handleDownload = useCallback(() => {
    if (Platform.OS !== 'web') {
      toast.show('Download only available on web', { type: 'info' })
      return
    }

    // Create a download link for the video
    const a = document.createElement('a')
    a.href = videoSrc(entry.videoUrl)
    a.download = `${entry.title}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [entry, toast])

  return (
    <View className="my-4 flex flex-row items-center">
      <Pressable
        onPress={handleLike}
        disabled={toggleLikeLoading}
        className="mr-4 flex flex-row items-center"
      >
        <LikeIcon 
          fill={isLiked ? '#FF5757' : 'none'} 
          stroke={isLiked ? '#FF5757' : 'white'} 
          className="mr-1"
        />
        <P className="text-sm">{isLiked ? 'Liked' : 'Like'}</P>
      </Pressable>
      
      <Pressable onPress={handleShare} className="mr-4 flex flex-row items-center">
        <ShareIcon className="mr-1" />
        <P className="text-sm">Share</P>
      </Pressable>
      
      <Pressable onPress={handleDownload} className="flex flex-row items-center">
        <DownloadIcon className="mr-1" />
        <P className="text-sm">Download</P>
      </Pressable>
    </View>
  )
}
