'use client'
import { XStack, YStack } from 'tamagui'
import { ReactElement } from 'react'
import { A, P } from 'app/design/typography'
type Props = {
  id: string
  link: string
}

export function EntryDetails({ id, link }: Props) {
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
      <XStack marginVertical="$2" flexDirection="row" alignItems="center" justifyContent="flex-start" overflow="hidden">
        <P marginRight="$2" minWidth="max-content" flex={1} flexGrow={1} fontSize="$3" color="$color11">
          {label}
        </P>
        {trailingWidget ? trailingWidget : null}
      </XStack>
    )
  }

  return (
    <YStack width="100%" marginTop="$4">
      <YStack backgroundColor="$backgroundHover" padding="$5" overflow="hidden" borderRadius="$3">
        <Row
          label="Metadata:"
          trailingWidget={
            <A
              href={link}
              target="_blank"
              fontSize="$3"
              color="$blue9"
            >
              {id}
            </A>
          }
        />
      </YStack>
    </YStack>
  )
}
