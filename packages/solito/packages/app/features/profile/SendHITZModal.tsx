'use client'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { useCallback, useEffect } from 'react'
import Wallet from 'app/ui/icons/wallet'
import { Formik, FormikProps } from 'formik'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useToast } from 'app/provider/toast'
import { Button } from 'app/design/button'
import { H1, P } from 'app/design/typography'
import { Modal } from 'app/design/modal'
import { useMutation } from '@apollo/client'
import { WITHDRAW_HITZ } from 'app/api/graphql/operations'
import * as Yup from 'yup'

// Define WithdrawalForm type
type WithdrawalForm = {
  address: string
  amount: number
}

type SendHITZModalProps = {
  visible: boolean
  onClose: () => void
  currentBalance: number
}

// Validation schema for HITZ withdrawals
const withdrawHitzSchema = (currentBalance: number) =>
  Yup.object().shape({
    address: Yup.string()
      .required('Stellar address is required')
      .matches(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format')
      .min(56, 'Stellar address must be 56 characters')
      .max(56, 'Stellar address must be 56 characters'),
    amount: Yup.number()
      .required('Amount is required')
      .positive('Amount must be positive')
      .max(currentBalance, `Amount cannot exceed ${currentBalance.toFixed(2)} HITZ`)
      .test(
        'min-amount',
        'Minimum withdrawal is 1 HITZ',
        (value) => !value || value >= 1
      ),
  })

export function SendHITZModal({
  visible,
  onClose,
  currentBalance,
}: SendHITZModalProps) {
  const [withdrawHitz, { data, loading, error }] = useMutation(WITHDRAW_HITZ)
  const toast = useToast()

  const initialValues: WithdrawalForm = {
    address: '',
    amount: 0,
  }

  useEffect(() => {
    if (data?.withdrawHitz?.success) {
      onClose()
      toast.show(
        `Successfully sent ${data.withdrawHitz.amount.toFixed(2)} HITZ to external wallet`,
        { type: 'success' }
      )
    }
  }, [data, toast, onClose])

  const onSubmit = useCallback(
    async ({ address, amount }: WithdrawalForm): Promise<void> => {
      try {
        await withdrawHitz({
          variables: {
            address,
            amount,
          },
        })
      } catch (err) {
        console.error('HITZ withdrawal error:', err)
        toast.show(
          error?.message || 'Failed to send HITZ. Please try again.',
          { type: 'danger' }
        )
      }
    },
    [withdrawHitz, error, toast]
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
              Send HITZ
            </H1>
            <P className="mt-2 text-xs text-[--text-secondary-color] text-center">
              Send HITZ tokens to any Stellar address
            </P>

            <View className="mt-8 w-full flex flex-row items-center justify-center">
              <View className="h-[18px] w-[18px] rounded-full bg-gradient-to-r from-[--primary-color] to-[--accent-color] mr-2" />
              <P className="font-unbounded text-[--text-color] ml-2">
                Current Balance: {currentBalance.toFixed(2)} HITZ
              </P>
            </View>

            <Formik
              initialValues={initialValues}
              onSubmit={onSubmit}
              validationSchema={withdrawHitzSchema(currentBalance)}
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
                    placeholder="HITZ to send (min 1 HITZ)"
                    icon={
                      <View className="h-[20px] w-[20px] rounded-full bg-gradient-to-r from-[--primary-color] to-[--accent-color]" />
                    }
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
                    text="Send HITZ"
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
