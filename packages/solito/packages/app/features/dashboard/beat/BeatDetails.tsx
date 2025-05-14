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
        <P className="mr-2 min-w-max flex-1 grow text-sm text-[--text-secondary-color]">
          {label}
        </P>
        {trailingWidget ? trailingWidget : null}
      </View>
    )
  }

  return (
    <View className="w-full mt-4">
      <View className="bg-[--bg-secondary-color] p-5 truncate rounded-lg">
        <Row
          label="IPFS Hash"
          trailingWidget={
            <A
              href={link}
              target="_blank"
              className="text-sm text-[--primary-color]"
            >
              {id}
            </A>
          }
        />
      </View>
    </View>
  )
}
