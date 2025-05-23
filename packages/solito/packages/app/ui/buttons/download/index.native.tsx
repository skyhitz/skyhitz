'use client'
import { useToast } from 'app/provider/toast'
import { DownloadButtonProps } from './types'
import { BaseDownloadButton } from './base'
import { useState } from 'react'
import { View, ActivityIndicator, Platform } from 'react-native'

// Safely check for FileSystem support without importing it directly
// This prevents crashes in Expo Go during component initialization

const DownloadBtn = ({
  size = 24,
  className = '',
  entry,
}: DownloadButtonProps) => {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleDownload = async () => {
    if (!entry.videoUrl) {
      toast.show('Video URL not available', { type: 'error' })
      return
    }

    // Expo Go compatibility check - don't use direct imports at the module level
    let isExpoGo = true

    try {
      // First check if we can dynamically load FileSystem
      const FileSystemModule = await Promise.resolve().then(() => {
        // Use require in a way that won't be statically analyzed
        // This prevents the module from being evaluated during initialization
        return global.require && global.require('expo-file-system')
      })
      if (FileSystemModule) {
        isExpoGo = false
        setDownloading(true)
        setProgress(0)

        // Execute the actual download logic
        await downloadWithFileSystem(FileSystemModule, entry.videoUrl)
      }
    } catch (error) {
      // This will happen in Expo Go
      console.log('FileSystem module not available:', error)
    }

    if (isExpoGo) {
      // Show message for Expo Go users
      toast.show(
        'Download requires a development build. Not available in Expo Go.',
        { type: 'warning' }
      )
    }
  }

  // Separate the actual download logic into its own function
  // This prevents any FileSystem code from executing during initialization
  const downloadWithFileSystem = async (FileSystem: any, videoUrl: string) => {
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
        await FileSystem.makeDirectoryAsync(fileUri, {
          intermediates: true,
        })
      }

      // Configure download progress tracking
      const callback = (downloadProgress: any) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite
        setProgress(progress)
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
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
    <BaseDownloadButton
      size={size}
      className={className}
      entry={entry}
      onPress={handleDownload}
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
      ) : null}
    </BaseDownloadButton>
  )
}

export default DownloadBtn
