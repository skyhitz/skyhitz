'use client'
import { CollapsableView } from 'app/ui/CollapsableView'
import { View } from 'react-native'
import { ReactElement } from 'react'
import { A, P } from 'app/design/typography'

type Props = {
  id: string
  link: string
}

export function Details({ id, link }: Props) {
  const Row = ({
    label,
    trailingWidget,
    value = '',
  }: {
    label: string
    trailingWidget?: ReactElement
    value?: string
  }) => {
    return (
      <View className="my-2 flex flex-row items-center justify-start truncate">
        <P className="mr-2 min-w-max flex-1 grow text-sm">{label}</P>
        {trailingWidget ? trailingWidget : null}
      </View>
    )
  }
  
  return (
    <View className="w-full mt-4">
      <View className="truncate bg-gray-900 p-5 rounded-lg">
        <Row
          label="IPFS Hash"
          trailingWidget={<A href={link} className="text-blue-500 text-sm">{id}</A>}
        />
      </View>
    </View>
  )
}
