'use client'
import { View, Pressable, Alert } from 'react-native'
import { PendingUpload } from 'app/api/graphql/types'
import { P, ActivityIndicator } from 'app/design/typography'
import { SolitoImage } from 'app/design/solito-image'
import { usePlayback } from 'app/hooks/usePlayback'
import { useRejectPendingUploadMutation } from 'app/api/graphql/mutations'
import { useToast } from 'app/provider/toast'
import { useState } from 'react'
import Check from 'app/ui/icons/check'
import { X } from 'app/ui/icons/x'

// R2 gateway URL for displaying images
const R2_GATEWAY = 'https://r2.skyhitz.io'

type PendingUploadEntryProps = {
  upload: PendingUpload
  onApprove: () => void
  onRejectComplete: () => void
}

export function PendingUploadEntry({
  upload,
  onApprove,
  onRejectComplete,
}: PendingUploadEntryProps) {
  const { playEntry } = usePlayback()
  const [rejectPendingUpload] = useRejectPendingUploadMutation()
  const toast = useToast()
  const [isRejecting, setIsRejecting] = useState(false)

  // Convert pending upload to entry format for playback
  const entryForPlayback = {
    id: upload.id,
    title: upload.title,
    artist: upload.artist,
    description: upload.description || '',
    imageUrl: `ipfs://${upload.imageHash}`,
    videoUrl: `ipfs://${upload.audioHash}`,
  }

  const handlePress = () => {
    playEntry(entryForPlayback as any, [entryForPlayback] as any)
  }

  const handleReject = async () => {
    // Show confirmation
    const confirmed = await new Promise<boolean>((resolve) => {
      if (typeof window !== 'undefined') {
        resolve(window.confirm(`Are you sure you want to reject "${upload.title}"? This will delete the uploaded files.`))
      } else {
        Alert.alert(
          'Reject Upload',
          `Are you sure you want to reject "${upload.title}"? This will delete the uploaded files.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Reject', style: 'destructive', onPress: () => resolve(true) },
          ]
        )
      }
    })

    if (!confirmed) return

    setIsRejecting(true)
    try {
      const result = await rejectPendingUpload({
        variables: {
          id: upload.id,
          reason: 'Quality standards not met',
        },
      })

      if (result.data?.rejectPendingUpload) {
        toast?.show('Upload rejected and files deleted', { type: 'success' })
        onRejectComplete()
      } else {
        toast?.show('Failed to reject upload', { type: 'danger' })
      }
    } catch (error: any) {
      console.error('Reject error:', error)
      toast?.show(error?.message || 'Failed to reject upload', { type: 'danger' })
    } finally {
      setIsRejecting(false)
    }
  }

  // Format date
  const uploadDate = new Date(upload.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Pressable onPress={handlePress} className="flex">
      <View
        className="flex flex-row items-center py-3 border-b border-[--border-color]"
        style={{ borderBottomWidth: 0.5 }}
      >
        {/* Album artwork */}
        <View className="aspect-square w-14 overflow-hidden rounded-lg">
          <SolitoImage
            src={`${R2_GATEWAY}/${upload.imageHash}/index`}
            alt={upload.title}
            contentFit="cover"
            fill
            sizes="3.5rem"
            style={{ borderRadius: 8 }}
          />
        </View>

        {/* Title, artist, and metadata */}
        <View className="ml-3 flex flex-1 justify-center pr-2">
          <View className="flex-row items-center">
            <P numberOfLines={1} className="text-sm font-bold leading-6 flex-1">
              {upload.title}
            </P>
            {/* Verified Artist Badge */}
            {upload.isVerifiedArtist && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-blue">
                <P className="text-white text-xs font-bold">✓ Artist</P>
              </View>
            )}
          </View>
          <P
            numberOfLines={1}
            className="text-xs leading-5 text-[--text-secondary-color]"
          >
            {upload.artist}
          </P>
          <View className="flex-row items-center mt-0.5 flex-wrap">
            <P className="text-xs text-[--text-secondary-color]">
              by {upload.userName}
            </P>
            <P className="mx-2 text-xs text-[--text-secondary-color]">•</P>
            <P className="text-xs text-[--text-secondary-color]">
              {uploadDate}
            </P>
            {/* Artist Equity Info */}
            {upload.isVerifiedArtist && upload.artistEquityBps !== undefined && upload.artistEquityBps > 0 && (
              <>
                <P className="mx-2 text-xs text-[--text-secondary-color]">•</P>
                <P className="text-xs text-blue font-bold">
                  {(upload.artistEquityBps / 100).toFixed(1)}% equity
                </P>
              </>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex flex-row items-center gap-2">
          {/* Approve button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              onApprove()
            }}
            className="flex items-center justify-center rounded-full bg-green-600 p-2.5"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            <Check size={18} className="text-white" />
          </Pressable>

          {/* Reject button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              handleReject()
            }}
            disabled={isRejecting}
            className="flex items-center justify-center rounded-full bg-red-600 p-2.5"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            {isRejecting ? (
              <ActivityIndicator size="small" />
            ) : (
              <X size={18} className="text-white" />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

