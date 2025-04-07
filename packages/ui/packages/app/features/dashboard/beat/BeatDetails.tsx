import { CollapsableView } from 'app/ui/CollapsableView'
import { View } from 'react-native'
import { ReactElement } from 'react'
import { Details as DetailsIcon } from 'app/ui/icons/details'
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
    <CollapsableView headerText="Details" icon={DetailsIcon}>
      <View className="truncate bg-white p-5">
        <Row
          label="Metadata:"
          trailingWidget={
            <View className="flex">
              <A href={link} target="_blank">
                {id}
              </A>
            </View>
          }
        />
      </View>
    </CollapsableView>
  )
}
