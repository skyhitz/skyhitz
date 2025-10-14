'use client'
import { View, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { useCallback, useMemo, useState } from 'react'
import Wallet from 'app/ui/icons/wallet'
import Stellar from 'app/ui/icons/stellar'
import Hitz from 'app/ui/icons/hitz'
import { Formik, FormikProps } from 'formik'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useWithdrawToExternalWalletMutation } from 'app/api/graphql/mutations'
import { useToast } from 'app/provider/toast'
import { Button } from 'app/design/button'
import { H1, P } from 'app/design/typography'
import { Modal } from 'app/design/modal'
import { AssetType, ASSET_INFO } from 'app/types/asset'
import { useMutation, useQuery } from '@apollo/client'
import { USER_CREDITS, USER_HITZ_BALANCE, WITHDRAW_HITZ, XLM_PRICE } from 'app/api/graphql/operations'
import { useAssetStore } from 'app/state/asset'

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
  const { selectedAsset, setSelectedAsset } = useAssetStore()
  const [xlmWithdraw] = useWithdrawToExternalWalletMutation()
  const [withdrawHitz] = useMutation(WITHDRAW_HITZ)

  const { data: xlmData, refetch: refetchXlm } = useQuery(USER_CREDITS, { fetchPolicy: 'network-only' })
  const { data: hitzData, refetch: refetchHitz } = useQuery(USER_HITZ_BALANCE, { fetchPolicy: 'network-only' })
  const { data: priceData } = useQuery(XLM_PRICE, { fetchPolicy: 'cache-first' })

  const xlmBalance = (xlmData?.userCredits ?? 0) as number
  const hitzBalance = (hitzData?.userHitzBalance ?? 0) as number

  const currentBalance = selectedAsset === AssetType.XLM ? xlmBalance : hitzBalance

  const [loading, setLoading] = useState(false)

  const initialValues: WithdrawalForm = { address: '', amount: 0 }

  const AssetIcon = selectedAsset === AssetType.XLM ? Stellar : Hitz
  const assetInfo = ASSET_INFO[selectedAsset]

  const validate = useCallback(
    (values: WithdrawalForm) => {
      const errors: Partial<Record<keyof WithdrawalForm, string>> = {}
      if (!values.address) errors.address = 'Stellar address is required'
      else if (!/^[A-Z0-9]+$/.test(values.address)) errors.address = 'Only A–Z and 0–9'
      else if (!(values.address.length === 56 || values.address.length === 69)) errors.address = 'Must be 56 or 69 chars'

      if (!values.amount) errors.amount = 'Amount is required'
      else if (values.amount <= 0) errors.amount = 'Amount must be positive'
      else if (selectedAsset === AssetType.XLM && values.amount < 3) errors.amount = 'Minimum withdrawal is 3 XLM'
      else if (values.amount > currentBalance) errors.amount = "You can't withdraw more than your balance"
      return errors
    },
    [currentBalance, selectedAsset]
  )

  const onSubmit = useCallback(
    async ({ address, amount }: WithdrawalForm) => {
      try {
        setLoading(true)
        if (selectedAsset === AssetType.XLM) {
          await xlmWithdraw({ variables: { address, amount } })
          // Refetch XLM balance after successful withdrawal
          await refetchXlm()
          toast.show('Amount successfully transferred to your external wallet', { type: 'success' })
        } else {
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
        }
        onClose()
      } catch (err: any) {
        toast.show(err?.message || 'Withdrawal failed. Please try again.', { type: 'danger' })
      } finally {
        setLoading(false)
      }
    },
    [onClose, selectedAsset, toast, withdrawHitz, xlmWithdraw, refetchXlm, refetchHitz]
  )

  const price = useMemo(() => parseFloat(priceData?.xlmPrice ?? '0') || 0, [priceData])

  return (
    <Modal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex w-full items-center rounded-xl border border-[--border-color] bg-[--bg-color] p-6">
          <View className="flex w-full items-center">
            <H1 className="text-xl font-bold font-unbounded text-[--text-color]">Withdraw</H1>
            <P className="mt-2 text-xs text-[--text-secondary-color] text-center">Send assets to any Stellar address</P>

            <View className="mt-6 flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedAsset(AssetType.XLM)}
                className={`px-3 py-1 rounded border ${selectedAsset === AssetType.XLM ? 'border-[--text-color]' : 'border-[--border-color]'} text-[--text-color] font-unbounded text-xs`}
              >
                <P className="text-[--text-color] text-xs font-unbounded">XLM</P>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={hitzBalance <= 0}
                onPress={() => setSelectedAsset(AssetType.HITZ)}
                className={`px-3 py-1 rounded border ${selectedAsset === AssetType.HITZ ? 'border-[--text-color]' : 'border-[--border-color]'} ${hitzBalance <= 0 ? 'opacity-50' : ''}`}
              >
                <P className="text-[--text-color] text-xs font-unbounded">HITZ</P>
              </Pressable>
            </View>

            <View className="mt-6 w-full flex flex-row items-center justify-center">
              <AssetIcon size={18} />
              <P className="font-unbounded text-[--text-color] ml-2">
                Current Balance: {currentBalance.toFixed(2)} {assetInfo.ticker}
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
                    placeholder={`${assetInfo.ticker} to send${selectedAsset === AssetType.XLM ? ' (min 1 XLM)' : ''}`}
                    icon={selectedAsset === AssetType.XLM ? <Stellar size={20} /> : <Hitz size={20} className="text-[--text-color]" />}
                    className="py-1 mb-2 w-full"
                    onChangeText={(text) => {
                      if (text === '') setFieldValue('amount', 0)
                      const num = parseFloat(text.replace(/[^0-9.]/g, ''))
                      if (!isNaN(num)) setFieldValue('amount', num)
                    }}
                  />

                  {selectedAsset === AssetType.XLM && price > 0 && values.amount > 0 ? (
                    <P className="text-[--text-secondary-color] text-xs mb-2">≈ ${(values.amount * price).toFixed(2)} USD</P>
                  ) : null}

                  {(errors.address || errors.amount) && (
                    <P className="mb-4 min-h-5 w-full text-center text-sm text-red">{errors.address || errors.amount}</P>
                  )}

                  <Button text={`Send ${assetInfo.ticker}`} onPress={handleSubmit} disabled={!isValid} loading={loading} />
                </View>
              )}
            </Formik>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}


