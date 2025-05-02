'use client'
import * as React from 'react'
import { Platform, Pressable } from 'react-native'
import Share from 'app/ui/icons/share'

type ShareButtonProps = {
  url: string
  title: string
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const handlePress = React.useCallback(() => {
    // Web platform
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        navigator.share({
          title,
          url,
        }).catch(error => console.error('Error sharing', error))
      } else {
        // Fallback to copy to clipboard for browsers without share API
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard')
        }).catch(err => {
          console.error('Failed to copy link: ', err)
        })
      }
    } else {
      // For React Native mobile platforms
      import('react-native').then(({ Share }) => {
        Share.share({
          title,
          message: url,
          url,
        }).catch(error => console.error('Error sharing', error))
      })
    }
  }, [url, title])

  return (
    <Pressable onPress={handlePress} className="mx-2">
      <Share className="h-6 w-6 fill-none stroke-current stroke-[1.5] text-white" />
    </Pressable>
  )
}
