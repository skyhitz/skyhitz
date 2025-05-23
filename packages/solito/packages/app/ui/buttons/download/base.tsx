'use client'
// Shared base component for DownloadBtn
import { Pressable } from 'react-native'
import DownloadIcon from 'app/ui/icons/download'
import { DownloadButtonProps } from './types'

export const BaseDownloadButton = ({
  size = 24,
  className = '',
  onPress,
  disabled = false,
  children,
}: DownloadButtonProps & {
  onPress: () => void
  disabled?: boolean
  children?: React.ReactNode
}) => {
  return (
    <Pressable onPress={onPress} className={className} disabled={disabled}>
      {children || <DownloadIcon size={size} />}
    </Pressable>
  )
}
