'use client'
import * as React from 'react'
import Copy from 'app/ui/icons/copy'
import * as Clipboard from 'expo-clipboard'
import { Button, XStack, Text } from 'tamagui'

type CopyBeatUrlButtonProps = {
  beatUrl: string
}

export function CopyBeatUrlButton({ beatUrl }: CopyBeatUrlButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await Clipboard.setStringAsync(beatUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.log('Failed to copy text:', error)
    }
  }, [beatUrl])

  return (
    <Button
      onPress={handleCopy}
      flexDirection="row"
      alignItems="center"
      borderRadius="$2"
      backgroundColor="$gray8"
      paddingHorizontal="$3"
      paddingVertical="$2"
    >
      <Copy marginRight="$2" width={16} height={16} color="$color12" />
      <Text fontSize="$3" color="$color12">
        {copied ? 'Copied!' : 'Copy Link'}
      </Text>
    </Button>
  )
}
