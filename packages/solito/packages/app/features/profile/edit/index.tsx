'use client'
import { View, ScrollView, Pressable } from 'react-native'
import InfoCircle from 'app/ui/icons/info-circle'
import PersonOutline from 'app/ui/icons/person-outline'
import MailOutline from 'app/ui/icons/mail-outline'
import XLogo from 'app/ui/icons/x-logo'
import Instagram from 'app/ui/icons/instagram'
import { useEffect, useState } from 'react'
import { useUpdateUserMutation } from 'app/api/graphql/mutations'
import { User } from 'app/api/graphql/types'
import { Formik, FormikProps } from 'formik'
import { LogOutBtn } from './logOutBtn'
import { useUserStore } from 'app/state/user'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useRouter, useSearchParams } from 'solito/navigation'
import { ChangeImage, EditProfileForm } from 'app/types'
import { editProfileFormSchema } from 'app/validation'
import useUploadFileToNFTStorage from 'app/hooks/useUploadFileToNFTStorage'
import { ipfsProtocol } from 'app/constants/constants'
import { useToast } from 'app/provider/toast'
import { ProfileHeader } from '../ProfileHeader'
import { ChangeImages } from './ChangeImages'
import { Button } from 'app/design/button'
import { SafeAreaView } from 'app/design/safe-area-view'
import { WithdrawCredits } from './WithdrawCredits'
import { useTheme } from 'app/state/theme/useTheme'
import { P } from 'app/design/typography'

export default function EditProfileScreen({ user }: { user: User }) {
  if (!user) return null

  const searchParams = useSearchParams()
  const showWithdraw = searchParams?.get('withdraw') === 'true'

  const { isDark, theme } = useTheme()
  const { setUser } = useUserStore()
  const [avatar, setAvatar] = useState<ChangeImage>({
    url: user.avatarUrl,
  })
  const [background, setBackground] = useState<ChangeImage>({
    url: user.backgroundUrl ?? '',
  })
  const [updateUser, { data, loading }] = useUpdateUserMutation()
  const { uploadFile, progress } = useUploadFileToNFTStorage()
  const { back } = useRouter()
  const toast = useToast()

  const handleUpdateUser = async (form: EditProfileForm) => {
    if (loading) return

    let avatarUrl = user.avatarUrl
    let backgroundUrl = user.backgroundUrl ?? ''

    try {
      if (avatar.blob) {
        const cid = await uploadFile(avatar.blob)
        avatarUrl = `${ipfsProtocol}${cid}`
      }

      if (background.blob) {
        const cid = await uploadFile(background.blob)
        backgroundUrl = `${ipfsProtocol}${cid}`
      }

      const { data: updateData } = await updateUser({
        variables: {
          displayName: form.displayName,
          username: form.username,
          email: form.email,
          twitter: form.twitter,
          instagram: form.instagram,
          avatarUrl,
          backgroundUrl,
        },
      })

      if (updateData?.updateUser) {
        const updatedUser = {
          ...user,
          displayName: form.displayName,
          username: form.username,
          email: form.email,
          twitter: form.twitter,
          instagram: form.instagram,
          avatarUrl,
          backgroundUrl,
        }

        setUser(updatedUser)
        toast.show('Your profile has been updated successfully!', {
          type: 'success',
        })
        back()
      }
    } catch (error) {
      toast.show((error as Error).message || 'Failed to update profile', {
        type: 'danger',
      })
    }
  }

  useEffect(() => {
    if (data?.updateUser) {
      back()
    }
  }, [data, back])

  if (showWithdraw) {
    return <WithdrawCredits />
  }

  return (
    <SafeAreaView className="bg-black">
      <ScrollView className="w-full bg-black">
        <ProfileHeader
          user={{
            ...user,
            avatarUrl: avatar.url,
            backgroundUrl: background.url,
          }}
        />

        <View className="mt-6 w-full items-center justify-center">
          <ChangeImages
            avatar={avatar}
            setAvatar={setAvatar}
            background={background}
            setBackground={setBackground}
            progress={progress}
          />
        </View>

        <View className="mt-4 flex w-full items-center justify-center px-4">
          <View className="w-full max-w-lg">
            <Formik
              validateOnMount
              initialValues={{
                displayName: user.displayName || '',
                username: user.username || '',
                email: user.email || '',
                twitter: user.twitter || '',
                instagram: user.instagram || '',
              }}
              onSubmit={handleUpdateUser}
              validationSchema={editProfileFormSchema}
            >
              {({
                values,
                handleChange,
                handleBlur,
                errors,
                touched,
                isValid,
                handleSubmit,
              }: FormikProps<EditProfileForm>) => (
                <View className="mb-4 mt-4 flex flex-col">
                  <FormInputWithIcon
                    icon={
                      <PersonOutline
                        className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-800'}`}
                      />
                    }
                    placeholder="Display Name"
                    value={values.displayName}
                    onChangeText={handleChange('displayName')}
                    onBlur={handleBlur('displayName')}
                    error={touched.displayName ? errors.displayName : undefined}
                    editable={!loading}
                  />
                  <FormInputWithIcon
                    icon={
                      <InfoCircle
                        className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-800'}`}
                      />
                    }
                    placeholder="Username"
                    value={values.username}
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    error={touched.username ? errors.username : undefined}
                    editable={!loading}
                  />
                  <FormInputWithIcon
                    icon={
                      <MailOutline
                        className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-800'}`}
                      />
                    }
                    placeholder="Email"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    error={touched.email ? errors.email : undefined}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <FormInputWithIcon
                    icon={
                      <XLogo
                        className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-800'}`}
                      />
                    }
                    placeholder="X username"
                    value={values.twitter}
                    onChangeText={handleChange('twitter')}
                    onBlur={handleBlur('twitter')}
                    error={touched.twitter ? errors.twitter : undefined}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <FormInputWithIcon
                    icon={
                      <Instagram
                        className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-800'}`}
                      />
                    }
                    placeholder="Instagram username"
                    value={values.instagram}
                    onChangeText={handleChange('instagram')}
                    onBlur={handleBlur('instagram')}
                    error={touched.instagram ? errors.instagram : undefined}
                    editable={!loading}
                    autoCapitalize="none"
                  />

                  <View className="mt-4 flex flex-row justify-between space-x-4">
                    <Pressable
                      onPress={() => back()}
                      className={`flex-1 items-center justify-center rounded-md px-3.5 py-2.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}
                      disabled={loading}
                    >
                      <P
                        className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}
                      >
                        Cancel
                      </P>
                    </Pressable>
                    <Button
                      onPress={() => handleSubmit()}
                      text="Update Profile"
                      loading={loading}
                      className="flex-1"
                      disabled={!isValid || loading}
                    />
                  </View>
                </View>
              )}
            </Formik>
          </View>

          <View className="mb-20 w-full max-w-lg">
            <LogOutBtn />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
