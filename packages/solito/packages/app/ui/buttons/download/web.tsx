'use client'
// Import from our typed components file instead of directly from react-native
import { Pressable } from 'react-native'
import { Entry } from 'app/api/graphql/types'
import { videoSrc } from 'app/utils/entry'
import { MICRO_SPEND_DOWNLOAD_XLM } from 'app/constants/constants'
import { useRouter } from 'solito/navigation'
import { useUserStore } from 'app/state/user'
import { useMutation } from '@apollo/client'
import { INVEST_ENTRY } from 'app/api/graphql/operations'
import { lumensToStroops } from 'app/utils'
import DownloadIcon from 'app/ui/icons/download'

interface Props {
  size?: number
  className?: string
  entry: Entry
}

const DownloadBtn = ({ size = 24, className = '', entry }: Props) => {
  const user = useUserStore((s) => s.user)
  const { push } = useRouter()
  const [invest] = useMutation(INVEST_ENTRY)

  const handleDownload = async () => {
    if (!user) {
      push('/sign-in')
      return
    }

    // Spend before downloading (no shares)
    try {
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

    // Create a download link for the video
    const a = document.createElement('a')
    a.href = videoSrc(entry.videoUrl)
    a.download = `${entry.title}.mp4`
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
