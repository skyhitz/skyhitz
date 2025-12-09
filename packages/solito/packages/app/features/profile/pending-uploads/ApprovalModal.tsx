'use client'
import { View, Pressable, Modal, Switch } from 'react-native'
import { PendingUpload } from 'app/api/graphql/types'
import { P, H1, ActivityIndicator } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useApprovePendingUploadMutation } from 'app/api/graphql/mutations'
import { useToast } from 'app/provider/toast'
import { useState } from 'react'
import { SolitoImage } from 'app/design/solito-image'

const R2_GATEWAY = 'https://r2.skyhitz.io'

type ApprovalModalProps = {
  visible: boolean
  upload: PendingUpload | null
  onClose: () => void
  onComplete: () => void
}

// Star rating component
function StarRating({
  rating,
  onRatingChange,
}: {
  rating: number
  onRatingChange: (rating: number) => void
}) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onRatingChange(star)}
          className="p-1"
        >
          <View
            className={`h-10 w-10 items-center justify-center rounded-full ${
              star <= rating ? 'bg-yellow-500' : 'bg-gray-600'
            }`}
          >
            <P
              className={`text-lg font-bold ${
                star <= rating ? 'text-black' : 'text-gray-400'
              }`}
            >
              ★
            </P>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

// Quality score label based on star rating
function getQualityLabel(stars: number): string {
  switch (stars) {
    case 1:
      return 'Poor Quality (2/10)'
    case 2:
      return 'Below Average (4/10)'
    case 3:
      return 'Average (6/10)'
    case 4:
      return 'Good Quality (8/10)'
    case 5:
      return 'Excellent (10/10)'
    default:
      return 'Select a rating'
  }
}

// Calculate mint cost based on star rating
function getMintCost(stars: number): string {
  const qualityScore = stars * 2
  const cost = Math.pow(10, 1 - qualityScore / 10)
  return Math.max(0.1, Math.min(10, cost)).toFixed(2)
}

export function ApprovalModal({
  visible,
  upload,
  onClose,
  onComplete,
}: ApprovalModalProps) {
  const [starRating, setStarRating] = useState(3)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvePendingUpload] = useApprovePendingUploadMutation()
  const toast = useToast()

  const handleApprove = async () => {
    if (!upload) return

    setIsApproving(true)
    try {
      const result = await approvePendingUpload({
        variables: {
          input: {
            id: upload.id,
            starRating,
            isAiGenerated,
          },
        },
      })

      if (result.data?.approvePendingUpload?.success) {
        toast?.show('Track approved and published! 🎉', { type: 'success' })
        onComplete()
      } else {
        toast?.show(
          result.data?.approvePendingUpload?.message || 'Failed to approve',
          { type: 'danger' }
        )
      }
    } catch (error: any) {
      console.error('Approval error:', error)
      
      // Handle specific error codes
      if (error?.message?.includes('INSUFFICIENT_FUNDS')) {
        toast?.show('User has insufficient balance to pay mint cost', {
          type: 'danger',
        })
      } else {
        toast?.show(error?.message || 'Failed to approve upload', {
          type: 'danger',
        })
      }
    } finally {
      setIsApproving(false)
    }
  }

  if (!upload) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/80 px-4">
        <View className="w-full max-w-md rounded-xl bg-[--bg-secondary-color] p-6">
          {/* Header */}
          <H1 className="text-center text-lg mb-6">Approve Upload</H1>

          {/* Track preview */}
          <View className="flex-row items-center mb-6 p-3 rounded-lg bg-[--bg-color]">
            <View className="aspect-square w-16 overflow-hidden rounded-lg">
              <SolitoImage
                src={`${R2_GATEWAY}/${upload.imageHash}/index`}
                alt={upload.title}
                contentFit="cover"
                fill
                sizes="4rem"
                style={{ borderRadius: 8 }}
              />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <P className="font-bold flex-1">{upload.title}</P>
                {upload.isVerifiedArtist && (
                  <View className="px-2 py-0.5 rounded-full bg-blue">
                    <P className="text-white text-xs font-bold">✓ Artist</P>
                  </View>
                )}
              </View>
              <P className="text-sm text-[--text-secondary-color]">
                {upload.artist}
              </P>
              <P className="text-xs text-[--text-secondary-color] mt-1">
                by {upload.userName}
              </P>
            </View>
          </View>

          {/* Artist Equity Info - Show if verified artist with equity */}
          {upload.isVerifiedArtist && upload.artistEquityBps !== undefined && upload.artistEquityBps > 0 && (
            <View className="mb-6 p-3 rounded-lg bg-blue/10 border border-blue">
              <P className="text-center text-sm font-bold text-blue mb-1">
                Verified Artist Equity
              </P>
              <View className="flex-row items-center justify-center">
                <View className="items-center mr-6">
                  <P className="text-xl font-bold text-blue">
                    {(upload.artistEquityBps / 100).toFixed(1)}%
                  </P>
                  <P className="text-xs text-[--text-secondary-color]">
                    Artist (non-dilutable)
                  </P>
                </View>
                <View className="items-center">
                  <P className="text-xl font-bold text-[--text-color]">
                    {(100 - upload.artistEquityBps / 100).toFixed(1)}%
                  </P>
                  <P className="text-xs text-[--text-secondary-color]">
                    Fan pool
                  </P>
                </View>
              </View>
            </View>
          )}

          {/* Star rating */}
          <View className="mb-6">
            <P className="text-center mb-3 font-bold">Quality Rating</P>
            <StarRating rating={starRating} onRatingChange={setStarRating} />
            <P className="text-center mt-3 text-sm text-[--text-secondary-color]">
              {getQualityLabel(starRating)}
            </P>
          </View>

          {/* Mint cost preview */}
          <View className="mb-6 p-3 rounded-lg bg-[--bg-color]">
            <P className="text-center text-sm text-[--text-secondary-color]">
              Creator will be charged:
            </P>
            <P className="text-center text-xl font-bold text-blue mt-1">
              {getMintCost(starRating)} XLM
            </P>
          </View>

          {/* AI Generated toggle */}
          <View className="mb-6 flex-row items-center justify-between p-3 rounded-lg bg-[--bg-color]">
            <View className="flex-1 mr-4">
              <P className="font-bold">AI Generated</P>
              <P className="text-xs text-[--text-secondary-color] mt-1">
                Mark if this track appears to be AI-generated
              </P>
            </View>
            <Switch
              value={isAiGenerated}
              onValueChange={setIsAiGenerated}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isAiGenerated ? '#2563eb' : '#f4f3f4'}
            />
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <Button
              text="Cancel"
              onPress={onClose}
              variant="secondary"
              disabled={isApproving}
              className="flex-1"
            />
            <Button
              text={isApproving ? 'Approving...' : 'Approve & Publish'}
              onPress={handleApprove}
              disabled={isApproving}
              className="flex-1"
            />
          </View>

          {isApproving && (
            <View className="mt-4 items-center">
              <ActivityIndicator />
              <P className="text-xs text-[--text-secondary-color] mt-2 text-center">
                Publishing to blockchain...
              </P>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

