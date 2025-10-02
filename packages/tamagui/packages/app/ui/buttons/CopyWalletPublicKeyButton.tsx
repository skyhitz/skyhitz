'use client'
import { Platform, Share } from 'react-native'
import { useCallback, useMemo, useState } from 'react'
import { Copy, Check } from '@tamagui/lucide-icons'
import { P } from 'app/design/typography'
import { trackCopyWallet } from 'app/utils/analytics'
import { useUserStore } from 'app/state/user'
import { Button } from 'tamagui'

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
    <Button
      height="auto"
      flex={1}
      minWidth={0}
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-start"
      onPress={copyPublicKey}
      disabled={copied}
      backgroundColor="transparent"
      padding="$0"
      borderWidth={0}
    >
      {!copied && <Copy color="$white1" size={18} />}
      {copied && <Check color="$green9" size={18} />}
      <P
        marginHorizontal="$2"
        fontSize="$2"
        flexShrink={1}
        flex={1}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {displayKey}
      </P>
    </Button>
  )
}
