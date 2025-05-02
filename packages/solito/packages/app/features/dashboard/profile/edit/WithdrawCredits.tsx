'use client'
import { View } from 'react-native'
import { useState } from 'react'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { useRouter } from 'solito/navigation'
import { useToast } from 'app/provider/toast'
import { Button } from 'app/design/button'
import { P, H2 } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import CreditCard from 'app/ui/icons/credit-card'
import { useUserCreditsQuery, useWithdrawToExternalWalletMutation } from 'app/api/graphql/mutations'

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

      const { data } = await withdrawToExternalWallet({
        variables: {
          address: form.address,
        },
      })

      if (data?.withdrawToExternalWallet) {
        toast?.show({
          type: 'success',
          title: 'Withdrawal Successful',
          message: 'Your XLM has been sent to the specified address.',
        })
        
        // Refresh user credits
        await refetch()
        
        back()
      }
    } catch (error) {
      toast?.show({
        type: 'error',
        title: 'Withdrawal Failed',
        message: (error as Error).message || 'Failed to process withdrawal',
      })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <SafeAreaView className="bg-black">
      <View className="mb-20 min-h-screen w-full bg-black pb-10">
        <View className="mx-auto mt-8 w-full max-w-lg px-4">
          <H2 className="mb-4 text-xl font-bold text-white">Withdraw Credits</H2>
          
          <P className="mb-4 text-white">
            Available balance: {credits?.userCredits || 0} XLM
          </P>
          
          <P className="mb-6 text-gray-400">
            Enter a Stellar address to withdraw your XLM credits. The entire balance 
            will be sent to this address. Make sure you have entered the correct address
            as transactions cannot be reversed.
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
              <View className="w-full">
                <FormInputWithIcon
                  icon={<CreditCard className="h-5 w-5 text-white" />}
                  placeholder="Stellar Address"
                  value={values.address}
                  onChangeText={handleChange('address')}
                  onBlur={handleBlur('address')}
                  error={touched.address ? errors.address : undefined}
                  editable={!withdrawing}
                  autoCapitalize="none"
                />

                <View className="mt-6 flex flex-row justify-between">
                  <Button
                    onPress={back}
                    text="Cancel"
                    variant="secondary"
                    className="mr-2 flex-1"
                  />
                  <Button
                    onPress={() => handleSubmit()}
                    text="Withdraw"
                    loading={withdrawing}
                    className="ml-2 flex-1"
                    disabled={!isValid || withdrawing || !credits?.userCredits}
                  />
                </View>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </SafeAreaView>
  )
}
