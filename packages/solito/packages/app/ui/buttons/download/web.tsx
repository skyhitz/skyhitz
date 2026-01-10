'use client'
// Import from our typed components file instead of directly from react-native
import { Pressable } from 'react-native'
import { Entry } from 'app/api/graphql/types'
import { getDownloadUrl } from 'app/utils/entry'
import { MICRO_SPEND_DOWNLOAD_HITZ } from 'app/constants/constants'
import { useRouter } from 'solito/navigation'
import { useUserStore } from 'app/state/user'
import { useMutation } from '@apollo/client'
import { INVEST_ENTRY, USER_HITZ_BALANCE } from 'app/api/graphql/operations'
import { lumensToStroops } from 'app/utils'
import DownloadIcon from 'app/ui/icons/download'
import { useQuery } from '@apollo/client'
import { useTopUpModalStore } from 'app/state/topup'
import { trackDownload } from 'app/utils/analytics'

interface Props {
  size?: number
  className?: string
  entry: Entry
}

const DownloadBtn = ({ size = 24, className = '', entry }: Props) => {
  const user = useUserStore((s) => s.user)
  const { push } = useRouter()
  const [invest] = useMutation(INVEST_ENTRY)
  const { data: hitzBalanceData } = useQuery(USER_HITZ_BALANCE, { fetchPolicy: 'network-only' })
  const openTopUpModal = useTopUpModalStore((s) => s.openTopUpModal)

  const handleDownload = async () => {
    if (!user) {
      push('/sign-in')
      return
    }

    // Spend before downloading (no shares)
    try {
      const available = Number(hitzBalanceData?.userHitzBalance ?? 0)
      if (!available || available < MICRO_SPEND_DOWNLOAD_HITZ) {
        openTopUpModal({ action: 'download', requiredHITZ: MICRO_SPEND_DOWNLOAD_HITZ, availableHITZ: available })
        return
      }
      const { data } = await invest({ variables: { id: entry.id, amount: lumensToStroops(MICRO_SPEND_DOWNLOAD_HITZ) } })
      const ok = !!data?.investEntry?.success
      if (!ok) {
        console.error('Invest before download not successful')
        return
      }
    } catch (e) {
      console.error('Invest before download failed', e)
      return
    }

    // Track download event
    trackDownload(entry.id, entry.title, entry.artist)

    // Get the correct download URL (tries MP4 first, falls back to original for audio files)
    const { url, extension } = await getDownloadUrl(entry.videoUrl)

    // Create a download link
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.title}.${extension}`
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
