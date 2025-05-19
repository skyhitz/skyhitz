'use client'
import * as React from 'react'
// Import from our typed components file instead of directly from react-native
import { Pressable, Text } from 'app/ui/components'
import Copy from 'app/ui/icons/copy'
// import { Clipboard } from 'app/utils/clipboard'

type CopyWalletPublicKeyButtonProps = {
  address: string
}

export function CopyWalletPublicKeyButton({
  address,
}: CopyWalletPublicKeyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  // Format address to show shortened version (first 6 and last 4 characters)
  const formattedAddress = React.useMemo(() => {
    if (!address || address.length < 12) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }, [address])

  const handleCopy = React.useCallback(async () => {
    try {
      // Clipboard functionality temporarily disabled
      // Clipboard.setString(address)

      // Just show the copied animation without actual clipboard interaction
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      console.log('Address copy requested (disabled):', address)
    } catch (error) {
      console.log(error)
    }
  }, [address])

  return (
    <Pressable
      onPress={handleCopy}
      className="flex-row items-center rounded-full bg-gray-800 px-4 py-2"
    >
      <Copy className="mr-2 h-4 w-4 stroke-current text-gray-300" />
      <Text className="text-sm text-gray-300">
        {copied ? 'Copied!' : formattedAddress}
      </Text>
    </Pressable>
  )
}
