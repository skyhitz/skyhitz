'use client'
import * as React from 'react'
import { Pressable, Text } from 'react-native'
import Copy from 'app/ui/icons/copy'
import { Clipboard } from 'app/utils/clipboard'

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
      console.error('Failed to copy text: ', error)
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
