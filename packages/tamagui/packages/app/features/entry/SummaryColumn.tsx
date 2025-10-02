'use client'
import { Entry } from 'app/api/graphql/types'
import { YStack, XStack } from 'tamagui'
import { Info } from '@tamagui/lucide-icons'
import { H1, P } from 'app/design/typography'
import { CollapsableView } from 'app/ui/CollapsableView'
import { ActionButtons } from './ActionButtons'
import InvestSection from './InvestSection'
import ClientLikesList from './ClientLikesList'

type Props = {
  entry: Entry
}

export function EntrySummaryColumn({ entry }: Props) {
  return (
    <YStack width="100%" marginLeft={{ md: '$4' }} flex={{ md: 1 }}>
      <YStack>
        <H1 
          fontFamily="$heading" 
          marginBottom="$2" 
          fontSize={{ xs: '$9', md: '$11' }} 
          fontWeight="bold" 
          marginLeft={{ xs: '$4', md: '$0' }}
        >
          {entry.title}
        </H1>
        <P fontSize={{ md: '$8' }} marginLeft={{ xs: '$4', md: '$0' }}>{entry.artist}</P>

        {/* Action buttons below title/artist to match legacy layout */}
        <XStack marginTop="$4" flexDirection="row" alignItems="center" gap="$4" marginLeft={{ xs: '$4', md: '$0' }}>
          <ActionButtons entry={entry} />
        </XStack>
      </YStack>

      {/* Invest component */}
      <InvestSection entry={entry} />

      <CollapsableView headerText="Description" icon={Info}>
        <P padding="$5" fontSize="$3" lineHeight="$6">{entry.description}</P>
      </CollapsableView>

      {/* Likes List (using ClientLikesList for cross-platform compatibility) */}
      <ClientLikesList entry={entry} />
    </YStack>
  )
}
