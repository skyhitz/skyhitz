'use client'
import { ReactNode } from 'react'
import { P } from 'app/design/typography'
import ChevronRight from 'app/ui/icons/chevron-right'
import { XStack } from 'tamagui'

type ProfileRowProps = {
  icon: ReactNode
  title: string
  count?: number
}

export function ProfileRow({ icon, title, count }: ProfileRowProps) {
  return (
    <XStack
      marginTop="$1.5"
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingVertical="$3"
    >
      <XStack flexDirection="row" alignItems="center">
        {icon}
        <P marginLeft="$3">{title}</P>
      </XStack>
      <XStack flexDirection="row" alignItems="center">
        {count !== undefined && <P marginRight="$2">{count}</P>}
        <ChevronRight width={20} height={20} fill="none" strokeWidth={2} stroke="$color12" />
      </XStack>
    </XStack>
  )
}
