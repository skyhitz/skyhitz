'use client'
import { videoSrc } from 'app/utils/entry'
import { useToast } from 'app/provider/toast'
import { DownloadButtonProps } from './types'
import { BaseDownloadButton } from './base'

const DownloadBtn = ({ size = 24, className = '', entry }: DownloadButtonProps) => {
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
    <BaseDownloadButton 
      size={size} 
      className={className} 
      entry={entry} 
      onPress={handleDownload}
    />
  )
}

export default DownloadBtn
