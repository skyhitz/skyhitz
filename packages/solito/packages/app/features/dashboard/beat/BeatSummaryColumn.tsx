'use client'
import { Entry } from 'app/api/graphql/types'
import { View } from 'react-native'
import InfoCircle from 'app/ui/icons/info-circle'
import { H1, P } from 'app/design/typography'
import { CollapsableView } from 'app/ui/CollapsableView'
import { ActionButtons } from './ActionButtons'
import CreateBid from './bids/CreateBid'
import ClientLikesList from './ClientLikesList'

type Props = {
  entry: Entry
}

export function BeatSummaryColumn({ entry }: Props) {
  return (
    <View className="flex w-full md:ml-4 md:flex-1">
      <View>
        <H1 className="font-unbounded mb-2 text-3xl font-bold md:text-5xl">
          {entry.title}
        </H1>
        <P className="md:text-2xl">{entry.artist}</P>

        {/* Action buttons below title/artist to match legacy layout */}
        <View className="mt-4 flex-row items-center gap-4">
          <ActionButtons entry={entry} />
        </View>
      </View>

      {/* Invest component */}
      <CreateBid entry={entry} />

      <CollapsableView headerText="Description" icon={InfoCircle}>
        <P className="p-5 text-sm leading-6">{entry.description}</P>
      </CollapsableView>

      {/* Likes List (using ClientLikesList for cross-platform compatibility) */}
      <ClientLikesList entry={entry} />
    </View>
  )
}
