import * as React from 'react'
import { Pressable } from 'react-native'
import Svg, { SvgProps, Path } from 'react-native-svg'
import { Entry } from 'app/api/graphql/types'
import { useTheme } from 'app/state/theme/useTheme'

interface Props {
  size?: number
  className?: string
  entry: Entry
}

const DownloadIcon = ({
  size = 24,
  stroke = "#6B7280",
  ...props
}: SvgProps & { size?: number }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="M7 10l5 5 5-5" />
      <Path d="M12 15V3" />
    </Svg>
  )
}

const DownloadBtn = ({ size = 24, className = "", entry }: Props) => {
  const { isDark } = useTheme()
  
  const handleDownload = () => {
    // In the real implementation, this would trigger a download from entry.audioUrl
    // For now, we'll just simulate the download action
    if (typeof window !== 'undefined') {
      // Use a dummy URL based on the entry ID since audioUrl is not in our Entry type
      const dummyUrl = `/api/download/${entry.id}.mp3`
      const link = document.createElement('a')
      link.href = dummyUrl
      link.download = `${entry.title || 'track'}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Pressable onPress={handleDownload} className={className}>
      <DownloadIcon size={size} stroke="var(--text-secondary-color)" />
    </Pressable>
  )
}

export default DownloadBtn
