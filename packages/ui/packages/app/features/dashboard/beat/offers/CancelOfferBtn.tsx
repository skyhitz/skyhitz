import { Entry } from 'app/api/graphql'
import { Button } from 'app/design/button'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { useState } from 'react'
import { CancelConfirmationModal } from './CancelOfferModal'

type Props = {
  entry: Entry
  offerId: string
}

export function CancelOfferBtn({ offerId, entry }: Props) {
  const [modalVisible, setModalVisible] = useState<boolean>(false)

  return (
    <ComponentAuthGuard>
      <Button
        text="Cancel"
        className="mr-1 mt-3 flex-row-reverse"
        onPress={() => {
          setModalVisible(true)
        }}
        useTouchable
        size="small"
        variant="secondary"
      />
      <CancelConfirmationModal
        visible={modalVisible}
        entry={entry}
        offerId={offerId}
        hideModal={() => {
          setModalVisible(false)
        }}
      />
    </ComponentAuthGuard>
  )
}
