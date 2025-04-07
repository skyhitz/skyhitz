import { Entry, useUpdatePricingMutation } from 'app/api/graphql'
import { Modal, Pressable, Text } from 'react-native'
import { Button } from 'app/design/button'
import { useCallback, useState } from 'react'
import X from 'app/ui/icons/x'
import { useToast } from 'app/provider/toast'
import { useErrorReport } from 'app/hooks/useErrorReport'
// import { useWalletConnectClient } from "app/provider/WalletConnect";
// import { WalletConnectModal } from "app/ui/modal/WalletConnectModal";
import { sellOffersUrl } from 'app/hooks/useUserOffers'
import { useSWRConfig } from 'swr'
import { useRecoilValue } from 'recoil'
import { useUserAtomState } from 'app/state/user'
import { getEntryOfferUrl } from 'app/hooks/useEntryOffer'

type Props = {
  visible: boolean
  entry: Entry
  offerId: string
  hideModal: () => void
}

export const CancelConfirmationModal = ({
  visible,
  hideModal,
  entry,
  offerId,
}: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string | undefined>()
  const [updatePricing] = useUpdatePricingMutation()
  const toast = useToast()
  const reportError = useErrorReport()
  // const { signAndSubmitXdr, session, connect } = useWalletConnectClient();
  // const [uri, setUri] = useState<string>("");
  // const [walletConnectModalVisible, setWalletConnectModalVisible] =
  //   useState<boolean>(false);

  const { user } = useUserAtomState()
  const { mutate } = useSWRConfig()

  const revalidateOffers = () => {
    mutate(getEntryOfferUrl(entry.code, entry.issuer))
    mutate(sellOffersUrl(user?.publicKey, entry.issuer, entry.code))
  }

  const handelSubmit = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await updatePricing({
        variables: {
          id: entry.id!,
          equityForSale: 0,
          price: 0,
          forSale: false,
          offerID: offerId,
        },
      })

      if (data?.updatePricing?.success) {
        if (data.updatePricing.submitted) {
          setLoading(false)
          hideModal()
          toast.show('You have successfully cancelled an offer', {
            type: 'success',
          })
          revalidateOffers()
        } else if (data.updatePricing.xdr) {
          // setMessage("Sign and submit transaction in your wallet");
          // const xdr = data.updatePricing.xdr;
          // let currentSession = session;
          // if (!currentSession) {
          //   currentSession = await connect((newUri) => {
          //     setUri(newUri);
          //     setWalletConnectModalVisible(true);
          //   });
          // }
          // const response = await signAndSubmitXdr(xdr, currentSession);
          // setMessage(undefined);
          // setLoading(false);
          // const { status } = response as { status: string };
          // if (status === "success") {
          //   hideModal();
          //   toast.show("You have cancelled an offer", {
          //     type: "success",
          //   });
          //   revalidateOffers();
          // } else {
          //   hideModal();
          //   reportError(
          //     Error(
          //       "Something went wrong during signing and submitting transaction in your wallet."
          //     )
          //   );
          // }
        }
      } else {
        hideModal()
        reportError(Error("You don't have any offers."))
      }
    } catch (ex) {
      hideModal()
      reportError(ex)
    }
  }, [
    hideModal,
    setLoading,
    revalidateOffers,
    // setUri,
    // setWalletConnectModalVisible,
    setMessage,
    reportError,
  ])

  return (
    <>
      <Modal visible={visible} transparent>
        <Pressable
          onPress={hideModal}
          className="bg-blue-field/70 flex w-full flex-1 items-center justify-center p-4"
        >
          <Pressable
            onPress={() => {}}
            className="bg-blue-field flex w-full max-w-lg items-center p-4"
          >
            <Pressable className="absolute right-2 top-2 " onPress={hideModal}>
              <X className="text-white" />
            </Pressable>
            <Text className="text-lg font-bold">
              Confirm to cancel the offer.
            </Text>
            {message && (
              <Text className="my-4 min-h-5 w-full text-center text-sm">
                {message}
              </Text>
            )}
            <Button
              className="mt-4"
              text="Confirm"
              onPress={handelSubmit}
              disabled={loading}
              loading={loading}
            />
          </Pressable>
        </Pressable>
      </Modal>
      {/* <WalletConnectModal
        visible={walletConnectModalVisible}
        close={() => setWalletConnectModalVisible(false)}
        uri={uri}
      /> */}
    </>
  )
}
