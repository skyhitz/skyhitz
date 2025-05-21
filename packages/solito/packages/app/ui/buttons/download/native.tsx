'use client'
// Import from our typed components file instead of directly from react-native
import { Pressable } from 'app/ui/components'
import { Entry } from 'app/api/graphql/types'
import { useToast } from 'app/provider/toast'
import DownloadIcon from 'app/ui/icons/download'
import { useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import * as FileSystem from 'expo-file-system'

interface Props {
  size?: number
  className?: string
  entry: Entry
}

const DownloadBtn = ({ size = 24, className = '', entry }: Props) => {
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
    <Pressable
      onPress={handleDownload}
      className={className}
      disabled={downloading}
    >
      {downloading ? (
        <View
          style={{
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="small" color="white" />
        </View>
      ) : (
        <DownloadIcon size={size} />
      )}
    </Pressable>
  )
}

export default DownloadBtn
