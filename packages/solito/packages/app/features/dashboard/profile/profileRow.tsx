'use client'
import { ReactNode } from 'react'
import { P } from 'app/design/typography'
import { View } from 'react-native'
import ChevronRight from 'app/ui/icons/chevron-right'

type ProfileRowProps = {
  icon: ReactNode
  title: string
  count?: number
}

export function ProfileRow({ icon, title, count }: ProfileRowProps) {
  return (
    <View className="mt-1.5 flex w-full flex-row items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <View className="flex flex-row items-center">
        {icon}
        <P className="ml-3 text-white">{title}</P>
      </View>
      <View className="flex flex-row items-center">
        {count !== undefined && <P className="mr-2 text-white">{count}</P>}
        <ChevronRight className="h-5 w-5 fill-none stroke-current stroke-2 text-white" />
      </View>
    </View>
  )
}
