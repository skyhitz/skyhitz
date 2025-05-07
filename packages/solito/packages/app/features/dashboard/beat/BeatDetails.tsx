'use client'
import { CollapsableView } from 'app/ui/CollapsableView'
import { View } from 'react-native'
import { ReactElement } from 'react'
import { A, P } from 'app/design/typography'
import { useTheme } from 'app/state/theme/useTheme'

type Props = {
  id: string
  link: string
}

export function Details({ id, link }: Props) {
  const { isDark } = useTheme()
  
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
        <P className={`mr-2 min-w-max flex-1 grow text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </P>
        {trailingWidget ? trailingWidget : null}
      </View>
    )
  }
  
  return (
    <View className="w-full mt-4">
      <View 
        style={{
          backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
          borderRadius: 8,
          padding: 20,
        }}
        className="truncate rounded-lg">
        <Row
          label="IPFS Hash"
          trailingWidget={<A href={link} className="text-sm text-[--primary-color]">{id}</A>}
        />
      </View>
    </View>
  )
}
