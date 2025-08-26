'use client'
import { Platform, Share, Pressable } from 'react-native'
import { useCallback, useState } from 'react'
import Copy from 'app/ui/icons/copy'
import Check from 'app/ui/icons/check'
import { P } from 'app/design/typography'

type Props = {
  walletPublicKey: string
}

export function CopyWalletPublicKeyButton({ walletPublicKey }: Props) {
  const [copied, changeCopied] = useState(false)

  const copyPublicKey = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(walletPublicKey)
        changeCopied(true)
      } else if (Platform.OS === 'ios') {
        await Share.share({
          url: walletPublicKey,
        }).then(({ action }) => {
          if (action !== Share.dismissedAction) changeCopied(true)
        })
      } else {
        await Share.share({
          message: walletPublicKey,
        }).then(({ action }) => {
          if (action === Share.sharedAction) changeCopied(true)
        })
      }
    } catch (error) {
      // no-op
    }
  }, [walletPublicKey])

  return (
    <Pressable
      className="flex h-fit flex-1 flex-row items-center justify-start"
      onPress={copyPublicKey}
      disabled={copied}
    >
      {!copied && <Copy className="text-white" size={18} />}
      {copied && <Check className="text-green" size={18} />}
      <P className="mx-2 truncate text-xs">{walletPublicKey}</P>
    </Pressable>
  )
}
