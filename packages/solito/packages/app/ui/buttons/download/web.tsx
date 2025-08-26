'use client'
// Import from our typed components file instead of directly from react-native
import { Pressable } from 'react-native'
import { Entry } from 'app/api/graphql/types'
import { videoSrc } from 'app/utils/entry'
import { useToast } from 'app/provider/toast'
import DownloadIcon from 'app/ui/icons/download'

interface Props {
  size?: number
  className?: string
  entry: Entry
}

const DownloadBtn = ({ size = 24, className = '', entry }: Props) => {
  const toast = useToast()

  const handleDownload = () => {
    // Create a download link for the video
    const a = document.createElement('a')
    a.href = videoSrc(entry.videoUrl)
    a.download = `${entry.title}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Pressable onPress={handleDownload} className={className}>
      <DownloadIcon size={size} />
    </Pressable>
  )
}

export default DownloadBtn
