import { Entry, EntryHolder } from 'app/api/graphql'
import { Button } from 'app/design/button'
import { useState, useMemo } from 'react'
import { useUserAtomState } from 'app/state/user'
import { compose, map, prop, sum, filter } from 'ramda'
import { CreateOfferModal } from './CreateOfferModal'
import { ComponentAuthGuard } from 'app/utils/authGuard'

type Props = {
  offerId: string
  entry: Entry
  holders?: EntryHolder[] | null
}

export function CreateOfferBtn({ offerId, entry, holders }: Props) {
  const [modalVisible, setModalVisible] = useState<boolean>(false)

  const { user } = useUserAtomState()

  const totalBalance = useMemo(() => {
    return holders ? sum(map(compose(parseInt, prop('balance')), holders)) : 1
  }, [holders])

  const currentUserHolder = useMemo(() => {
    return holders
      ? filter((holder) => holder.account === user?.publicKey, holders)
      : []
  }, [holders, user])

  const currentUserBalance = useMemo(() => {
    return sum(map(compose(parseInt, prop('balance')), currentUserHolder))
  }, [currentUserHolder])

  const maxEquityForSale = (
    (currentUserBalance / totalBalance) *
    100
  ).toString()
  const modalText = offerId === '0' ? 'Create' : 'Modify'

  return (
    <ComponentAuthGuard>
      <Button
        text={modalText}
        className="mr-1 mt-3 flex-row-reverse"
        onPress={() => {
          setModalVisible(true)
        }}
        useTouchable
        size="small"
      />
      <CreateOfferModal
        visible={modalVisible}
        entry={entry}
        offerId={offerId}
        maxEquityForSale={maxEquityForSale}
        hideModal={() => {
          setModalVisible(false)
        }}
      />
    </ComponentAuthGuard>
  )
}
