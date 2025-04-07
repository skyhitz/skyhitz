import { Pressable } from 'react-native'
import { useCallback, useState } from 'react'
import { CopyIcon } from 'app/ui/icons/copy'
import CheckIcon from 'app/ui/icons/check'

type Props = {
  beatUrl: string
}

function CopyBeatUrlButton({ beatUrl }: Props) {
  const [copied, changeCopied] = useState(false)

  const copyBeatUrl = useCallback(async () => {
    navigator.clipboard.writeText(beatUrl)
    changeCopied(true)
  }, [beatUrl, changeCopied])

  if (!copied) {
    return (
      <Pressable onPress={copyBeatUrl}>
        <CopyIcon className="text-white" size={20} />
      </Pressable>
    )
  } else {
    return <CheckIcon className="text-lightGreen" size={20} />
  }
}

export { CopyBeatUrlButton }
