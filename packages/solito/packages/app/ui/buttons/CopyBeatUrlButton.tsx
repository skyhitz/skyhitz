'use client'
import * as React from 'react'
// Import from our typed components file instead of directly from react-native
import { Pressable, Text } from 'react-native'
import Copy from 'app/ui/icons/copy'
import * as Clipboard from 'expo-clipboard'

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
    <Pressable
      onPress={handleCopy}
      className="flex-row items-center rounded-md bg-white/10 px-3 py-2"
    >
      <Copy className="mr-2 h-4 w-4 stroke-current text-[--text-color]" />
      <Text className="text-sm text-[--text-color]">
        {copied ? 'Copied!' : 'Copy Link'}
      </Text>
    </Pressable>
  )
}
