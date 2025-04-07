import { Entry, useUpdatePricingMutation } from 'app/api/graphql'
import { Modal, Pressable, View, Text, Image } from 'react-native'
import X from 'app/ui/icons/x'
import PieChartIcon from 'app/ui/icons/pie'
import { imageUrlSmall, imageSrc } from 'app/utils/entry'
import { useState, useCallback } from 'react'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useToast } from 'app/provider/toast'
import { useErrorReport } from 'app/hooks/useErrorReport'
// import { useWalletConnectClient } from "app/provider/WalletConnect";
// import { WalletConnectModal } from "app/ui/modal/WalletConnectModal";
import { useSWRConfig } from 'swr'
import { getEntryOfferUrl } from 'app/hooks/useEntryOffer'
import { useUserAtomState } from 'app/state/user'
import { sellOffersUrl } from 'app/hooks/useUserOffers'
import Dollar from 'app/ui/icons/dollar'
import { Button } from 'app/design/button'
import { SolitoImage } from 'app/design/solito-image'

type Props = {
  visible: boolean
  entry: Entry
  offerId: string
  maxEquityForSale: string
  hideModal: () => void
}

export const CreateOfferModal = ({
  visible,
  hideModal,
  entry,
  offerId,
  maxEquityForSale,
}: Props) => {
  const [equityForSale, setEquityForSale] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string | undefined>()
  const [updatePricing] = useUpdatePricingMutation()
  const toast = useToast()
  const reportError = useErrorReport()
  // const { signAndSubmitXdr, session, connect } = useWalletConnectClient();
  // const [uri, setUri] = useState<string>('')
  // const [walletConnectModalVisible, setWalletConnectModalVisible] =
  //   useState<boolean>(false)

  const { user } = useUserAtomState()
  const { mutate } = useSWRConfig()

  const revalidateOffers = useCallback(() => {
    mutate(getEntryOfferUrl(entry.code, entry.issuer))
    mutate(sellOffersUrl(user?.publicKey, entry.issuer, entry.code))
  }, [mutate, entry, user])

  const modalText = offerId === '0' ? 'Create an offer' : 'Modify an offer'

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await updatePricing({
        variables: {
          id: entry.id!,
          equityForSale: parseInt(equityForSale, 10) / 100,
          price: parseInt(price, 10),
          forSale: true,
          offerID: offerId,
        },
      })

      if (data?.updatePricing?.success) {
        if (data.updatePricing.submitted) {
          setLoading(false)
          hideModal()
          toast.show('You have successfully created an offer', {
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
          //   toast.show("You have successfully created an offer", {
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
      }
    } catch (ex) {
      setLoading(false)
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
    equityForSale,
    price,
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
            <Text className="text-lg font-bold">{modalText}</Text>
            <View className="my-4 flex-row items-center">
              <View className="h-10 w-10">
                <SolitoImage
                  src={entry.imageUrl ? imageUrlSmall(entry.imageUrl) : ''}
                  fill
                  alt={entry.title}
                  contentFit="cover"
                />
              </View>

              <Text className="ml-2">
                {entry.title}-{entry.artist}
              </Text>
            </View>
            <View className="mb-3 flex items-center md:flex-row">
              <FormInputWithIcon
                containerClassNames="border border-white rounded p-5 md:mr-2 mb-2 md:mb-0"
                icon={Dollar}
                value={price}
                onChangeText={(text) => {
                  if (text === '') {
                    setPrice('')
                  } else {
                    const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
                    setPrice(num.toString())
                  }
                }}
                placeholder="Price (XLM)"
                keyboardType="numeric"
                maxLength={10}
              />
              <FormInputWithIcon
                containerClassNames="border border-white rounded p-5 md:ml-2"
                icon={PieChartIcon}
                value={equityForSale}
                onChangeText={(text) => {
                  if (text === '') {
                    setEquityForSale('')
                  } else {
                    const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
                    if (num <= parseInt(maxEquityForSale, 10) && num >= 1) {
                      setEquityForSale(num.toString())
                    }
                  }
                }}
                placeholder={`Equity To Sell (1-${maxEquityForSale})%`}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {message && (
              <Text className="my-4 min-h-5 w-full text-center text-sm">
                {message}
              </Text>
            )}
            <Button
              text="Confirm"
              size="large"
              onPress={handleSubmit}
              className="mb-5 md:mb-0 md:mr-5"
              disabled={price === '' || equityForSale === '' || loading}
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
