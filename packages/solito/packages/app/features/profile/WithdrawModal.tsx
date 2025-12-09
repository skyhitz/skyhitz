'use client'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { useCallback, useState } from 'react'
import Wallet from 'app/ui/icons/wallet'
import Hitz from 'app/ui/icons/hitz'
import { Formik, FormikProps } from 'formik'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useToast } from 'app/provider/toast'
import { Button } from 'app/design/button'
import { H1, P } from 'app/design/typography'
import { Modal } from 'app/design/modal'
import { useMutation, useQuery } from '@apollo/client'
import { USER_HITZ_BALANCE, WITHDRAW_HITZ } from 'app/api/graphql/operations'

type WithdrawalForm = {
  address: string
  amount: number
}

type Props = {
  visible: boolean
  onClose: () => void
}

export function WithdrawModal({ visible, onClose }: Props) {
  const toast = useToast()
  const [withdrawHitz] = useMutation(WITHDRAW_HITZ)

  const { data: hitzData, refetch: refetchHitz } = useQuery(USER_HITZ_BALANCE, { fetchPolicy: 'network-only' })

  const hitzBalance = (hitzData?.userHitzBalance ?? 0) as number

  const [loading, setLoading] = useState(false)

  const initialValues: WithdrawalForm = { address: '', amount: 0 }

  const validate = useCallback(
    (values: WithdrawalForm) => {
      const errors: Partial<Record<keyof WithdrawalForm, string>> = {}
      if (!values.address) errors.address = 'Stellar address is required'
      else if (!/^[A-Z0-9]+$/.test(values.address)) errors.address = 'Only A–Z and 0–9'
      else if (!(values.address.length === 56 || values.address.length === 69)) errors.address = 'Must be 56 or 69 chars'

      if (!values.amount) errors.amount = 'Amount is required'
      else if (values.amount <= 0) errors.amount = 'Amount must be positive'
      else if (values.amount > hitzBalance) errors.amount = "You can't withdraw more than your balance"
      return errors
    },
    [hitzBalance]
  )

  const onSubmit = useCallback(
    async ({ address, amount }: WithdrawalForm) => {
      try {
        setLoading(true)
        const res = await withdrawHitz({ variables: { address, amount } })
        if (res?.data?.withdrawHitz?.success) {
          // Refetch HITZ balance after successful withdrawal
          await refetchHitz()
          toast.show(
            `Successfully sent ${res.data.withdrawHitz.amount.toFixed(2)} HITZ to external wallet`,
            { type: 'success' }
          )
        } else {
          throw new Error(res?.data?.withdrawHitz?.message || 'Failed to send HITZ')
        }
        onClose()
      } catch (err: any) {
        toast.show(err?.message || 'Withdrawal failed. Please try again.', { type: 'danger' })
      } finally {
        setLoading(false)
      }
    },
    [onClose, toast, withdrawHitz, refetchHitz]
  )

  return (
    <Modal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex w-full items-center rounded-xl border border-[--border-color] bg-[--bg-color] p-6">
          <View className="flex w-full items-center">
            <H1 className="text-xl font-bold font-unbounded text-[--text-color]">Withdraw HITZ</H1>
            <P className="mt-2 text-xs text-[--text-secondary-color] text-center">Send HITZ to any Stellar address</P>

            <View className="mt-6 w-full flex flex-row items-center justify-center">
              <Hitz size={18} className="text-[--text-color]" />
              <P className="font-unbounded text-[--text-color] ml-2">
                Current Balance: {hitzBalance.toFixed(2)} HITZ
              </P>
            </View>

            <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate} validateOnMount>
              {({ handleSubmit, values, setFieldValue, errors, isValid }: FormikProps<WithdrawalForm>) => (
                <View className="mt-6 flex w-full items-center">
                  <FormInputWithIcon
                    value={values.address}
                    placeholder="Stellar Address (Without Memo)"
                    icon={<Wallet size={20} />}
                    className="py-1 mb-4 w-full"
                    onChangeText={(text) => {
                      const valid = text.replace(/[^A-Z0-9]/g, '')
                      setFieldValue('address', valid)
                    }}
                  />

                  <FormInputWithIcon
                    value={values.amount > 0 ? values.amount.toString() : ''}
                    placeholder="HITZ to send"
                    icon={<Hitz size={20} className="text-[--text-color]" />}
                    className="py-1 mb-2 w-full"
                    onChangeText={(text) => {
                      if (text === '') setFieldValue('amount', 0)
                      const num = parseFloat(text.replace(/[^0-9.]/g, ''))
                      if (!isNaN(num)) setFieldValue('amount', num)
                    }}
                  />

                  {(errors.address || errors.amount) && (
                    <P className="mb-4 min-h-5 w-full text-center text-sm text-red">{errors.address || errors.amount}</P>
                  )}

                  <Button text="Send HITZ" onPress={handleSubmit} disabled={!isValid} loading={loading} />
                </View>
              )}
            </Formik>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
