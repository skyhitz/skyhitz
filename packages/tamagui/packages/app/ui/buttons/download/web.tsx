'use client'
import { Entry } from 'app/api/graphql/types'
import { videoSrc } from 'app/utils/entry'
import { MICRO_SPEND_DOWNLOAD_XLM } from 'app/constants/constants'
import { useRouter } from 'app/navigation'
import { useUserStore } from 'app/state/user'
import { useMutation } from '@apollo/client'
import { INVEST_ENTRY } from 'app/api/graphql/operations'
import { lumensToStroops } from 'app/utils'
import DownloadIcon from 'app/ui/icons/download'
import { useQuery } from '@apollo/client'
import { USER_CREDITS } from 'app/api/graphql/operations'
import { useTopUpModalStore } from 'app/state/topup'
import { trackDownload } from 'app/utils/analytics'
import { Button, GetProps } from 'tamagui'

type Props = GetProps<typeof Button> & {
  size?: number
  entry: Entry
}

const DownloadBtn = ({ size = 24, entry, ...props }: Props) => {
  const user = useUserStore((s) => s.user)
  const { push } = useRouter()
  const [invest] = useMutation(INVEST_ENTRY)
  const { data: creditsData } = useQuery(USER_CREDITS, { fetchPolicy: 'network-only' })
  const openTopUpModal = useTopUpModalStore((s) => s.openTopUpModal)

  const handleDownload = async () => {
    if (!user) {
      push('/sign-in')
      return
    }

    // Spend before downloading (no shares)
    try {
      const available = Number(creditsData?.userCredits ?? 0)
      if (!available || available < MICRO_SPEND_DOWNLOAD_XLM) {
        openTopUpModal({ action: 'download', requiredXLM: MICRO_SPEND_DOWNLOAD_XLM, availableXLM: available })
        return
      }
      const { data } = await invest({ variables: { id: entry.id, amount: lumensToStroops(MICRO_SPEND_DOWNLOAD_XLM) } })
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

    // Create a download link for the video
    const a = document.createElement('a')
    a.href = videoSrc(entry.videoUrl)
    a.download = `${entry.title}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Button 
      onPress={handleDownload}
      backgroundColor="transparent"
      padding="$0"
      borderWidth={0}
      {...props}
    >
      <DownloadIcon size={size} />
    </Button>
  )
}

export default DownloadBtn
