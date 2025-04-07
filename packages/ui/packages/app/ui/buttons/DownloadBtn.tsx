import { Pressable } from 'react-native'
import Download from 'app/ui/icons/download'
import { ErrorType } from 'app/types'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { useUserAtomState } from 'app/state/user'
import { useToast } from 'app/provider/toast'
import { ipfsProtocol, pinataGateway } from 'app/constants/constants'
import { useState } from 'react'
import { ActivityIndicator } from 'app/design/typography'
import { Entry, useInvestEntryMutation } from 'app/api/graphql'
import { lumensToStroops } from 'app/utils'

type Props = {
  size: number
  className?: string
  entry: Entry
}

function DownloadButton({ size, className, entry }: Props) {
  const { user } = useUserAtomState()
  const [downloading, setDownloading] = useState(false)
  const [invest] = useInvestEntryMutation()

  const toast = useToast()

  const download = async () => {
    if (!user) return
    setDownloading(true)
    try {
      const { data } = await invest({
        variables: {
          id: entry.id!,
          amount: lumensToStroops(0.3),
        },
      })
      const res = await fetch(
        `${entry.videoUrl.replace(ipfsProtocol, pinataGateway + '/')}`,
      )
      const blob = await res.blob()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `${entry.title.replace(/ /g, '').split('#')[0]}.mp4`,
      )
      document.body.appendChild(link)
      link.click()
      link?.parentNode?.removeChild(link)
    } catch (e) {
      const err = e as Partial<ErrorType>
      toast.show(err?.message ?? 'Unknown error', { type: 'danger' })
    }
    setDownloading(false)
  }

  return (
    <Pressable className={className} onPress={download}>
      {downloading ? (
        <ActivityIndicator grey size={size} />
      ) : (
        <Download className={'text-gray-600'} size={size} />
      )}
    </Pressable>
  )
}

export default function DownloadBtn(props: Props) {
  return (
    <ComponentAuthGuard linkToAuth>
      <DownloadButton {...props} />
    </ComponentAuthGuard>
  )
}
