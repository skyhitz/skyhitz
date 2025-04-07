import { useUserAtomState } from 'app/state/user'
import { FormInputWithIcon } from './inputs/FormInputWithIcon'
import LinkIcon from './icons/link'
import MailIcon from './icons/mail-outline'
import { useSubmitLinkMutation } from 'app/api/graphql'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { Button } from 'app/design/button'
import { useState } from 'react'
import { View } from 'react-native'
import { P } from 'app/design/typography'

const validationSchema = Yup.object().shape({
  link: Yup.string().url('Invalid URL').required('Link is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
})

type FormData = {
  link: string
  email: string
}

export const InterestForm = () => {
  const { user } = useUserAtomState()
  const [submitted, setSubmitted] = useState(false)

  const [submitLink, { loading, error }] = useSubmitLinkMutation()

  const handleSubmit = async (
    formData: FormData,
    { resetForm }: { resetForm: () => void },
  ) => {
    if (loading) return
    const res = await submitLink({
      variables: {
        link: formData.link,
        email: formData.email,
      },
    })
    if (res.data?.submitLink.success) {
      setSubmitted(true)
      resetForm()
    }
  }

  const initialValues: FormData = {
    link: '',
    email: '',
  }
  return (
    <Formik
      validateOnMount
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({
        values,
        handleChange,
        handleBlur,
        errors,
        touched,
        isValid,
        handleSubmit,
      }: FormikProps<FormData>) => (
        <View className="flex">
          <View className="mt-10 flex flex-col items-center gap-x-6 md:flex-row">
            <View className="flex w-full flex-grow md:w-auto">
              <FormInputWithIcon
                value={values.link}
                containerClassNames="border border-white rounded md:mr-2 !py-2"
                icon={() => (
                  <LinkIcon
                    size={22}
                    className="absolute right-2 border-4 border-white bg-white"
                  />
                )}
                onChangeText={handleChange('link')}
                onBlur={handleBlur('link')}
                className="text-md border-grey-light flex-grow rounded-md border-[0.5px] px-4 py-2 font-bold text-gray-600 focus:border-gray-600 focus-visible:outline-gray-600 md:ml-2"
                placeholder="Music NFT link"
                iconPosition="right"
                keyboardType="url"
                onSubmitEditing={() => handleSubmit()}
                editable={!loading}
              />
              <FormInputWithIcon
                value={values.email}
                containerClassNames="border border-white rounded md:mr-2 !py-2"
                icon={() => (
                  <MailIcon
                    size={22}
                    className="absolute right-2 border-4 border-white bg-white"
                  />
                )}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                className="text-md border-grey-light flex-grow rounded-md border-[0.5px] px-4 py-2 font-bold text-gray-600 focus:border-gray-600 focus-visible:outline-gray-600 md:ml-2"
                placeholder="Email"
                iconPosition="right"
                onSubmitEditing={() => handleSubmit()}
                editable={!loading}
              />
            </View>

            <Button
              onPress={handleSubmit}
              loading={loading}
              text={submitted ? 'Done!' : 'Submit'}
              size="default"
              className="w-full md:mr-2 md:w-40"
              disabled={!isValid}
            />
          </View>
          <View className="mt-4 flex-row">
            <P className="text-red min-h-5 w-full px-2 text-left text-sm">
              {(touched.link && errors.link) ||
                (touched.email && errors.email) ||
                error?.message}
            </P>
          </View>
        </View>
      )}
    </Formik>
  )
}
