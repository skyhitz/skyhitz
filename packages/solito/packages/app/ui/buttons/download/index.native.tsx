'use client'
import { useToast } from 'app/provider/toast'
import { DownloadButtonProps } from './types'
import { BaseDownloadButton } from './base'
import { useState } from 'react'
import { View, ActivityIndicator, Platform } from 'react-native'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { useMutation, useQuery } from '@apollo/client'
import { RECORD_ACTION, USER_CREDITS } from 'app/api/graphql/operations'
import { useTopUpModalStore } from 'app/state/topup'
import { MICRO_SPEND_DOWNLOAD_XLM } from 'app/constants/constants'
import { trackDownload } from 'app/utils/analytics'
import { isExternalPreview } from 'app/utils/external-entry'

// Safely check for FileSystem support without importing it directly
// This prevents crashes in Expo Go during component initialization

const DownloadBtn = ({
  size = 24,
  className = '',
  entry,
}: DownloadButtonProps) => {
  const toast = useToast()
  const user = useUserStore((s) => s.user)
  const { push } = useRouter()
  const [recordAction] = useMutation(RECORD_ACTION)
  const { data: creditsData } = useQuery(USER_CREDITS, { skip: !user, fetchPolicy: 'network-only' })
  const openTopUpModal = useTopUpModalStore((s) => s.openTopUpModal)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleDownload = async () => {
    if (!user) {
      push('/sign-in')
      return
    }

    // Disable download for external preview entries
    if (isExternalPreview(entry.id)) {
      console.log('[DownloadBtn] Download disabled for external preview:', entry.id)
      return
    }

    if (!entry.videoUrl) {
      toast.show('Video URL not available', { type: 'error' })
      return
    }

    // Check balance
    const available = Number(creditsData?.userCredits ?? 0)
    if (!available || available < MICRO_SPEND_DOWNLOAD_XLM) {
      openTopUpModal({ action: 'download', requiredXLM: MICRO_SPEND_DOWNLOAD_XLM, availableXLM: available })
      return
    }

    // Record download action (charges fee automatically)
    try {
      const res = await recordAction({
        variables: {
          id: entry.id,
          action: 'download',
        },
      })

      if (!res?.data?.recordAction?.success) {
        toast.show('Failed to process download', { type: 'error' })
        return
      }

      const fee = res.data.recordAction.fee
      
      // Track download event
      trackDownload(entry.id, entry.title, entry.artist)

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
          toast.show(`Downloaded! Fee: ${fee.toFixed(4)} XLM`, { type: 'success' })
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
    } catch (error) {
      console.error('Failed to record download action:', error)
      toast.show('Download failed', { type: 'error' })
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

  // Hide download button for external previews
  if (isExternalPreview(entry.id)) {
    return null
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
