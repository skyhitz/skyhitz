'use client'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { useCallback, useEffect } from 'react'
import Wallet from 'app/ui/icons/wallet'
import Stellar from 'app/ui/icons/stellar'
import { Formik, FormikProps } from 'formik'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useWithdrawToExternalWalletMutation } from 'app/api/graphql/mutations'
import { withdrawFormSchema } from 'app/validation'
import { useToast } from 'app/provider/toast'
import { Button } from 'app/design/button'
import { H1, P } from 'app/design/typography'
import { Modal } from 'app/design/modal'

// Define WithdrawalForm type locally to match schema expectations
type WithdrawalForm = {
  address: string
  amount: number
}

type SendXLMModalProps = {
  visible: boolean
  onClose: () => void
  currentBalance: number
}

export function SendXLMModal({
  visible,
  onClose,
  currentBalance,
}: SendXLMModalProps) {
  const [withdraw, { data, loading, error }] =
    useWithdrawToExternalWalletMutation()
  const toast = useToast()

  const initialValues: WithdrawalForm = {
    address: '',
    amount: 0,
  }

  useEffect(() => {
    if (data?.withdrawToExternalWallet) {
      onClose()
      toast.show('Amount successfully transferred to your external wallet', {
        type: 'success',
      })
    }
  }, [data, toast, onClose])

  const onSubmit = useCallback(
    async ({ address, amount }: WithdrawalForm): Promise<void> => {
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
    [withdraw]
  )

  return (
    <Modal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex w-full items-center rounded-xl border border-[--border-color] bg-[--bg-color] p-6">
          <View className="flex w-full items-center">
            <H1 className="text-xl font-bold font-unbounded text-[--text-color]">
              Send XLM
            </H1>

            <View className="mt-8 w-full flex flex-row items-center justify-center">
              <Stellar size={18} className="mr-2" />
              <P className="font-unbounded text-[--text-color]">
                Current Balance: {currentBalance.toFixed(2)} XLM
              </P>
            </View>

            <Formik
              initialValues={initialValues}
              onSubmit={onSubmit}
              validationSchema={withdrawFormSchema(currentBalance)}
              validateOnMount
            >
              {({
                handleSubmit,
                values,
                handleChange,
                isValid,
                errors,
                setFieldValue,
              }: FormikProps<WithdrawalForm>) => (
                <View className="mt-6 flex w-full items-center">
                  <FormInputWithIcon
                    value={values.address}
                    placeholder="Stellar Address (Without Memo)"
                    icon={<Wallet size={20} />}
                    className="py-1 mb-4 w-full"
                    onChangeText={(text) => {
                      // Only allow uppercase letters and numbers (valid Stellar address characters)
                      const validStellarAddress = text.replace(/[^A-Z0-9]/g, '')
                      setFieldValue('address', validStellarAddress)
                    }}
                  />

                  <FormInputWithIcon
                    value={values.amount > 0 ? values.amount.toString() : ''}
                    placeholder="XLM to send"
                    icon={<Stellar size={20} />}
                    className="py-1 mb-6 w-full"
                    onChangeText={(text) => {
                      if (text === '') {
                        setFieldValue('amount', 0)
                      }
                      const num = parseFloat(text.replace(/[^0-9.]/g, ''))
                      if (!isNaN(num)) {
                        setFieldValue('amount', num)
                      }
                    }}
                  />

                  <P className="mb-6 text-xs text-[--text-secondary-color]">
                    Send to Stellar Public Network address only. Do not send if
                    a memo is required, funds will be lost if you send to a
                    wallet that requires a Memo.
                  </P>

                  {(errors.address || errors.amount || error) && (
                    <P className="mb-4 min-h-5 w-full text-center text-sm text-red">
                      {errors.address || errors.amount || error?.message}
                    </P>
                  )}

                  <Button
                    text="Send XLM"
                    onPress={handleSubmit}
                    disabled={!isValid}
                    loading={loading}
                  />
                </View>
              )}
            </Formik>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
