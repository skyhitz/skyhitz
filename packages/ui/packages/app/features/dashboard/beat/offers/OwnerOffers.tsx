import { CollapsableView } from 'app/ui/CollapsableView'
import { View, Text } from 'react-native'
import { ArrowsUpDownIcon } from 'app/ui/icons/arrows-up-down'
import { ActiveOffer } from './ActiveOffer'
import { Entry, EntryHolder } from 'app/api/graphql'
import { CreateOfferBtn } from 'app/features/dashboard/beat/offers/CreateOfferBtn'
import { useUserOffers } from 'app/hooks/useUserOffers'
import { useUserAtomState } from 'app/state/user'
import { useMemo } from 'react'
import { filter } from 'ramda'

type OwnerOffersProps = {
  entry: Entry
  holders?: EntryHolder[] | null
}

export function OwnerOffers({ entry, holders }: OwnerOffersProps) {
  const { user } = useUserAtomState()
  const { offers } = useUserOffers(user?.publicKey, entry.issuer, entry.code)

  const isOwner = useMemo(() => {
    const arrayWithOwner = holders
      ? filter((holder) => holder.account === user?.publicKey, holders)
      : []

    return arrayWithOwner.length > 0
  }, [holders, user])

  const Offers = () => {
    return (
      <CollapsableView headerText="Offers" icon={ArrowsUpDownIcon}>
        <View>
          {offers.map((offer, index) => (
            <ActiveOffer
              key={offer.id}
              entry={entry}
              index={index}
              offer={offer}
              holders={holders}
            />
          ))}
        </View>
      </CollapsableView>
    )
  }

  const CreateOfferRow = () => {
    return (
      <CollapsableView headerText="Offers" icon={ArrowsUpDownIcon}>
        <View>
          <View className="bg-blue-transparent justify-between px-5 py-3 md:flex-row md:items-center">
            <Text className="my-1 text-sm md:my-0">
              You don&apos;t have any offers
            </Text>
            <CreateOfferBtn entry={entry} holders={holders} offerId="0" />
          </View>
        </View>
      </CollapsableView>
    )
  }

  if (!isOwner) return null

  return <>{offers && offers.length > 0 ? <Offers /> : <CreateOfferRow />}</>
}
