'use client'
import { Platform } from 'react-native'
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
import { YStack, XStack } from 'tamagui'

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
      <YStack
        width="100%"
        alignItems="center"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$background"
        padding="$6"
      >
        <YStack width="100%" alignItems="center">
          <H1
            fontSize="$7"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color12"
          >
            Send XLM
          </H1>

          <XStack
            marginTop="$8"
            width="100%"
            alignItems="center"
            justifyContent="center"
            gap="$2"
          >
            <Stellar size={18} />
            <P
              fontFamily="$heading"
              color="$color12"
            >
              Current Balance: {currentBalance.toFixed(2)} XLM
            </P>
          </XStack>

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
                <YStack marginTop="$6" width="100%" alignItems="center">
                  <FormInputWithIcon
                    value={values.address}
                    placeholder="Stellar Address (Without Memo)"
                    icon={<Wallet size={20} />}
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

                  <P
                    marginBottom="$6"
                    fontSize="$2"
                    color="$color11"
                  >
                    Send to Stellar Public Network address only. Do not send if
                    a memo is required, funds will be lost if you send to a
                    wallet that requires a Memo.
                  </P>

                  {(errors.address || errors.amount || error) && (
                    <P
                      marginBottom="$4"
                      minHeight={20}
                      width="100%"
                      textAlign="center"
                      fontSize="$3"
                      color="$red9"
                    >
                      {errors.address || errors.amount || error?.message}
                    </P>
                  )}

                  <Button
                    text="Send XLM"
                    onPress={handleSubmit}
                    disabled={!isValid}
                    loading={loading}
                  />
                </YStack>
              )}
            </Formik>
          </YStack>
        </YStack>
    </Modal>
  )
}
