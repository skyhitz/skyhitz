'use client'
import { Platform, Share, Pressable } from 'react-native'
import { useCallback, useMemo, useState } from 'react'
import Copy from 'app/ui/icons/copy'
import Check from 'app/ui/icons/check'
import { P } from 'app/design/typography'
import { trackCopyWallet } from 'app/utils/analytics'
import { useUserStore } from 'app/state/user'

type Props = {
  walletPublicKey: string
}

export function CopyWalletPublicKeyButton({ walletPublicKey }: Props) {
  const [copied, changeCopied] = useState(false)
  const user = useUserStore((s) => s.user)

  // Render a shortened version to avoid overflow on all platforms
  const displayKey = useMemo(() => {
    if (!walletPublicKey) return ''
    const head = walletPublicKey.slice(0, 10)
    const tail = walletPublicKey.slice(-10)
    return `${head}...${tail}`
  }, [walletPublicKey])

  const copyPublicKey = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(walletPublicKey)
        changeCopied(true)
        // Track wallet copy event
        trackCopyWallet(user?.id, 'profile')
      } else if (Platform.OS === 'ios') {
        await Share.share({
          url: walletPublicKey,
        }).then(({ action }) => {
          if (action !== Share.dismissedAction) {
            changeCopied(true)
            // Track wallet copy event
            trackCopyWallet(user?.id, 'profile')
          }
        })
      } else {
        await Share.share({
          message: walletPublicKey,
        }).then(({ action }) => {
          if (action === Share.sharedAction) {
            changeCopied(true)
            // Track wallet copy event
            trackCopyWallet(user?.id, 'profile')
          }
        })
      }
    } catch (error) {
      // no-op
    }
  }, [walletPublicKey])

  return (
    <Pressable
      className="flex h-fit flex-1 min-w-0 flex-row items-center justify-start"
      onPress={copyPublicKey}
      disabled={copied}
    >
      {!copied && <Copy className="text-white" size={18} />}
      {copied && <Check className="text-green" size={18} />}
      <P
        className="mx-2 text-xs shrink flex-1"
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {displayKey}
      </P>
    </Pressable>
  )
}
