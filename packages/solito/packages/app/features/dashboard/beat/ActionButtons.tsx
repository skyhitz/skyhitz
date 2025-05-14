'use client'
import { Entry } from 'app/api/graphql/types'
import { useLikeEntry } from 'app/hooks/algolia/useLikeEntry'
import { videoSrc } from 'app/utils/entry'
import { useCallback } from 'react'
import { Pressable, View } from 'react-native'
import LikeIcon from 'app/ui/icons/like'
import DownloadIcon from 'app/ui/icons/download'
import { Platform } from 'react-native'
import { useUserStore } from 'app/state/user'
import { useToast } from 'app/provider/toast'
import { ShareButton } from 'app/ui/buttons/ShareButton'
import { PlayButton } from './PlayButton'

interface ActionButtonsProps {
  entry: Entry
}

export function ActionButtons({ entry }: ActionButtonsProps) {
  const user = useUserStore((state) => state.user)
  const toast = useToast()
  const { likeEntry, isLiked, toggleLikeLoading } = useLikeEntry(entry)

  const handleLike = useCallback(() => {
    if (!user) {
      toast.show('You need to be logged in to like this beat', {
        type: 'error',
      })
      return
    }
    likeEntry()
  }, [likeEntry, user, toast])

  // This will now be handled by the ShareButton component

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
    <>
      <PlayButton entry={entry} />
      {/* Like button */}
      <Pressable onPress={handleLike} disabled={toggleLikeLoading}>
        <LikeIcon
          fill={isLiked ? '#FF5757' : 'none'}
          stroke={isLiked ? '#FF5757' : 'var(--text-color)'}
          width={22}
          height={22}
        />
      </Pressable>

      {/* Share button */}
      <ShareButton
        url={`https://skyhitz.io/dashboard/beat/${entry.id}`}
        title="Share this beat!"
      />

      {/* Download button */}
      <Pressable onPress={handleDownload}>
        <View className="w-6 h-6 flex items-center justify-center">
          <DownloadIcon className="text-[--text-color]" size={20} />
        </View>
      </Pressable>
    </>
  )
}
