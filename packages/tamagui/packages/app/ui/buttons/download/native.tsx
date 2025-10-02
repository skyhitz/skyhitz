'use client'
import { Entry } from 'app/api/graphql/types'
import { useToast } from 'app/provider/toast'
import DownloadIcon from 'app/ui/icons/download'
import { useState } from 'react'
import { ActivityIndicator } from 'app/design/typography'
import * as FileSystem from 'expo-file-system'
import { Button, YStack, GetProps } from 'tamagui'

type Props = GetProps<typeof Button> & {
  size?: number
  entry: Entry
}

const DownloadBtn = ({ size = 24, entry, ...props }: Props) => {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleDownload = async () => {
    if (!entry.videoUrl) {
      toast.show('Video URL not available', { type: 'error' })
      return
    }

    try {
      // Format filename: artist_title.mp4 format
      let fileName = ''

      // Format artist name (if available)
      const artistPart = entry.artist
        ? entry.artist
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .substring(0, 10) // Limit artist name to 10 chars
        : 'unknown'

      // Format title (if available)
      const titlePart = entry.title
        ? entry.title
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .substring(0, 10) // Limit title to 10 chars
        : entry.id || 'track'

      // Combine as artist_title.mp4
      fileName = `${artistPart}_${titlePart}.mp4`
      const fileUri = `${FileSystem.documentDirectory}downloads/`
      const filePath = `${fileUri}${fileName}`

      // Create downloads directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(fileUri)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(fileUri, { intermediates: true })
      }

      // Start download with progress tracking
      setDownloading(true)
      setProgress(0)

      const callback = (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite
        setProgress(progress)
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        entry.videoUrl,
        filePath,
        {},
        callback
      )

      const result = await downloadResumable.downloadAsync()

      if (result) {
        // Successful download
        toast.show(`Downloaded to: ${fileName}`, { type: 'success' })
      }
    } catch (error) {
      toast.show(`Download failed: ${error.message}`, { type: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      onPress={handleDownload}
      disabled={downloading}
      backgroundColor="transparent"
      padding="$0"
      borderWidth={0}
      {...props}
    >
      {downloading ? (
        <YStack
          width={size}
          height={size}
          justifyContent="center"
          alignItems="center"
        >
          <ActivityIndicator size="small" />
        </YStack>
      ) : (
        <DownloadIcon size={size} />
      )}
    </Button>
  )
}

export default DownloadBtn
