'use client'
// Shared base component for DownloadBtn
import { Button } from 'tamagui'
import { Download } from '@tamagui/lucide-icons'
import { DownloadButtonProps } from './types'

export const BaseDownloadButton = ({
  size = 24,
  marginBottom,
  onPress,
  disabled = false,
  children,
}: DownloadButtonProps & {
  onPress: () => void
  disabled?: boolean
  children?: React.ReactNode
}) => {
  return (
    <Button onPress={onPress} marginBottom={marginBottom} disabled={disabled} backgroundColor="transparent" padding="$0">
      {children || <Download size={size} />}
    </Button>
  )
}
