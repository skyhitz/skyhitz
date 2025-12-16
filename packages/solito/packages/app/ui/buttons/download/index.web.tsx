'use client'
import { downloadSrc } from 'app/utils/entry'
import { useToast } from 'app/provider/toast'
import { DownloadButtonProps } from './types'
import { BaseDownloadButton } from './base'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { useMutation, useQuery } from '@apollo/client'
import { RECORD_ACTION, USER_HITZ_BALANCE } from 'app/api/graphql/operations'
import { useTopUpModalStore } from 'app/state/topup'
import { MICRO_SPEND_DOWNLOAD_HITZ } from 'app/constants/constants'
import { trackDownload } from 'app/utils/analytics'
import { isExternalPreview } from 'app/utils/external-entry'

const DownloadBtn = ({ size = 24, className = '', entry }: DownloadButtonProps) => {
  const toast = useToast()
  const user = useUserStore((s) => s.user)
  const { push } = useRouter()
  const [recordAction] = useMutation(RECORD_ACTION)
  const { data: hitzBalanceData } = useQuery(USER_HITZ_BALANCE, { skip: !user, fetchPolicy: 'network-only' })
  const openTopUpModal = useTopUpModalStore((s) => s.openTopUpModal)

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

    // Check balance
    const available = Number(hitzBalanceData?.userHitzBalance ?? 0)
    if (!available || available < MICRO_SPEND_DOWNLOAD_HITZ) {
      openTopUpModal({ action: 'download', requiredHITZ: MICRO_SPEND_DOWNLOAD_HITZ, availableHITZ: available })
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

      if (res?.data?.recordAction?.success) {
        const fee = res.data.recordAction.fee
        toast.show(`Download started! Fee: ${fee.toFixed(4)} HITZ`, { type: 'success' })
        
        // Track download event
        trackDownload(entry.id, entry.title, entry.artist)

        // Start the actual download - uses original file which works for all formats
        const a = document.createElement('a')
        a.href = downloadSrc(entry.videoUrl)
        a.download = entry.title
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to record download action:', error)
      toast.show('Download failed', { type: 'error' })
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
    />
  )
}

export default DownloadBtn
