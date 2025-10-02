'use client'
import { useState } from 'react'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { useRouter } from 'solito/navigation'
import { useToast } from 'app/provider/toast'
import { Button } from 'app/design/button'
import { P, H2, Text } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { CreditCard } from '@tamagui/lucide-icons'
import {
  useUserCreditsQuery,
  useWithdrawToExternalWalletMutation,
} from 'app/api/graphql/mutations'
import { YStack, XStack, Input } from 'tamagui'

type WithdrawForm = {
  address: string
}

const withdrawSchema = Yup.object().shape({
  address: Yup.string()
    .required('Stellar address is required')
    .matches(
      /^G[A-Z0-9]{55}$/,
      'Please enter a valid Stellar address starting with G'
    ),
})

export function WithdrawCredits() {
  const [withdrawing, setWithdrawing] = useState(false)
  const { data: credits, refetch } = useUserCreditsQuery()
  const [withdrawToExternalWallet] = useWithdrawToExternalWalletMutation()
  const { back } = useRouter()
  const toast = useToast()

  const handleWithdraw = async (form: WithdrawForm) => {
    if (withdrawing) return

    try {
      setWithdrawing(true)

      const available = Number(credits?.userCredits || 0)
      // Withdraw almost all available balance from this legacy screen
      // keep a tiny buffer to avoid rounding or fee edge cases
      const amount = Math.max(0, available - 0.01)

      const { data } = await withdrawToExternalWallet({
        variables: {
          address: form.address,
          amount,
        },
      })

      if (data?.withdrawToExternalWallet) {
        toast.show('Your XLM has been sent to the specified address.', {
          type: 'success',
        })

        // Refresh user credits
        await refetch()

        back()
      }
    } catch (error) {
      toast.show((error as Error).message || 'Failed to process withdrawal', {
        type: 'danger',
      })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <SafeAreaView backgroundColor="$black">
      <YStack marginBottom="$20" minHeight="100vh" width="100%" backgroundColor="$black" paddingBottom="$10">
        <YStack marginHorizontal="auto" marginTop="$8" width="100%" maxWidth={512} paddingHorizontal="$4">
          <H2 marginBottom="$4" fontSize="$5" fontWeight="bold" color="$white1">
            Withdraw Credits
          </H2>

          <P marginBottom="$4" color="$white1">
            Available balance: {credits?.userCredits || 0} XLM
          </P>

          <P marginBottom="$6" color="$gray9">
            Enter a Stellar address to withdraw your XLM credits. The entire
            balance will be sent to this address. Make sure you have entered the
            correct address as transactions cannot be reversed.
          </P>

          <Formik
            validateOnMount
            initialValues={{
              address: '',
            }}
            onSubmit={handleWithdraw}
            validationSchema={withdrawSchema}
          >
            {({
              values,
              handleChange,
              handleBlur,
              errors,
              touched,
              isValid,
              handleSubmit,
            }: FormikProps<WithdrawForm>) => (
              <YStack width="100%">
                <YStack marginBottom="$4">
                  <XStack position="relative" flexDirection="row" alignItems="center" borderRadius="$3" borderWidth={1} backgroundColor="$gray2" borderColor="$borderColor" focusWithinStyle={{ borderColor: '$blue9' }}>
                    <YStack position="absolute" left="$3" zIndex={10}>
                      <CreditCard size={20} color="$white1" />
                    </YStack>

                    <Input
                      placeholder="Stellar Address"
                      placeholderTextColor="$gray9"
                      value={values.address}
                      onChangeText={handleChange('address')}
                      onBlur={handleBlur('address')}
                      editable={!withdrawing}
                      autoCapitalize="none"
                      flex={1}
                      borderRadius="$3"
                      paddingVertical="$3"
                      paddingHorizontal="$3"
                      color="$white1"
                      paddingLeft="$10"
                      backgroundColor="transparent"
                      borderWidth={0}
                    />
                  </XStack>

                  {touched.address && errors.address && (
                    <Text marginTop="$1" fontSize="$3" color="$red9">
                      {errors.address}
                    </Text>
                  )}
                </YStack>

                <XStack marginTop="$6" flexDirection="row" justifyContent="space-between">
                  <Button
                    onPress={back}
                    text="Cancel"
                    variant="secondary"
                    marginRight="$2"
                    flex={1}
                  />
                  <Button
                    onPress={() => handleSubmit()}
                    text="Withdraw"
                    loading={withdrawing}
                    marginLeft="$2"
                    flex={1}
                    disabled={!isValid || withdrawing || !credits?.userCredits}
                  />
                </XStack>
              </YStack>
            )}
          </Formik>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}
