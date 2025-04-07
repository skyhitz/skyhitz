import { Modal, Pressable, View, KeyboardAvoidingView } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'app/design/safe-area-view'
import X from 'app/ui/icons/x'
import Wallet from 'app/ui/icons/wallet'
import Dollar from 'app/ui/icons/dollar'
import { Formik, FormikProps } from 'formik'
import { Line } from 'app/ui/orSeparator'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import {
  useUserCreditsQuery,
  useWithdrawToExternalWalletMutation,
} from 'app/api/graphql'
import { WithdrawForm } from 'app/types'
import { withdrawFormSchema } from 'app/validation'
import { useToast } from 'app/provider/toast'
import { convertToString } from 'app/utils'
import { Button } from 'app/design/button'
import { P } from 'app/design/typography'
import { ProfileRow } from 'app/features/dashboard/profile/profileRow'
import Send from 'app/ui/icons/send'

export function WithdrawCredits() {
  const [modalVisible, setModalVisible] = useState(false)
  const { data: credits } = useUserCreditsQuery()
  const [withdraw, { data, loading, error }] =
    useWithdrawToExternalWalletMutation()
  const toast = useToast()

  const initialValues: WithdrawForm = {
    address: '',
    amount: 0,
  }

  useEffect(() => {
    if (data?.withdrawToExternalWallet) {
      setModalVisible(false)
      toast.show('Amount successfully transfered to your external wallet', {
        type: 'success',
      })
    }
  }, [data, toast])

  const onSubmit = useCallback(
    async ({ address, amount }: WithdrawForm): Promise<void> => {
      try {
        await withdraw({
          variables: {
            address,
            amount,
          },
        })
      } catch (_) {
        // no-op, just to catch error
      }
    },
    [withdraw],
  )

  return (
    <View>
      <ProfileRow
        icon={<Send size={24} className="text-blue" />}
        title="Send"
        onPress={() => setModalVisible(true)}
      />
      <Modal visible={modalVisible} transparent>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <SafeAreaView className="flex flex-1 items-center justify-center px-2">
            <View className="flex w-full max-w-lg items-center rounded-xl border border-gray-300 bg-white p-8">
              <Pressable
                className="absolute right-4 top-4"
                onPress={() => setModalVisible(false)}
              >
                <X className="text-gray-600" />
              </Pressable>
              <View className="flex w-72 items-center">
                <P className="text-lg font-bold">Send XLM</P>
                <P className="mt-12 w-full">
                  Current Balance: {convertToString(credits?.userCredits ?? 0)}
                  XLM
                </P>
                <Formik
                  initialValues={initialValues}
                  onSubmit={onSubmit}
                  validationSchema={withdrawFormSchema(
                    credits?.userCredits ?? 1,
                  )}
                  validateOnMount
                >
                  {({
                    handleSubmit,
                    values,
                    handleChange,
                    isValid,
                    errors,
                    setFieldValue,
                  }: FormikProps<WithdrawForm>) => (
                    <View className="flex w-full items-center">
                      <FormInputWithIcon
                        value={values.address}
                        placeholder="Stellar Address (Without Memo)"
                        icon={Wallet}
                        containerClassNames="py-1 mt-6 w-full"
                        onChangeText={handleChange('address')}
                      />
                      <Line />
                      <FormInputWithIcon
                        value={
                          values.amount > 0 ? values.amount.toString() : ''
                        }
                        placeholder="XLM to send"
                        icon={Dollar}
                        containerClassNames="py-1 mt-2 w-full"
                        onChangeText={(text) => {
                          if (text === '') {
                            setFieldValue('amount', 0)
                          }
                          const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
                          if (!isNaN(num)) {
                            setFieldValue('amount', num)
                          }
                        }}
                      />

                      <Line />
                      <P className="my-4 text-xs">
                        Send to Stellar Public Network address only. Do not send
                        if a memo is required, funds will be lost if you send to
                        a wallet that requires a Memo.
                      </P>
                      <Line />

                      {(errors.address || errors.amount || error) && (
                        <P className="my-4 min-h-5 w-full text-center text-sm text-[#d9544f]">
                          {errors.address || errors.amount || error?.message}
                        </P>
                      )}

                      <Button
                        text="Withdraw"
                        onPress={handleSubmit}
                        disabled={!isValid}
                        loading={loading}
                      />
                    </View>
                  )}
                </Formik>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
