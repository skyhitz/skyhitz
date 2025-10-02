'use client'
import { ScrollView } from 'react-native'
import { Info, User as UserIcon, Mail, Instagram } from '@tamagui/lucide-icons'
import XLogo from 'app/ui/icons/x-logo'
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
import useUploadFile from 'app/hooks/useUploadFile'
import { ipfsProtocol } from 'app/constants/constants'
import { useToast } from 'app/provider/toast'
import { ProfileHeader } from '../ProfileHeader'
import { ChangeImages } from './ChangeImages'
import { Button } from 'app/design/button'
import { SafeAreaView } from 'app/design/safe-area-view'
import { WithdrawCredits } from './WithdrawCredits'
import { useTheme } from 'app/state/theme/useTheme'
import { P } from 'app/design/typography'
import { YStack, XStack, Button as TamaguiButton } from 'tamagui'

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
  const { uploadFile, progress } = useUploadFile()
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
    <SafeAreaView backgroundColor="$black">
      <ScrollView style={{ width: '100%', backgroundColor: '#000' }}>
        <ProfileHeader
          user={{
            ...user,
            avatarUrl: avatar.url,
            backgroundUrl: background.url,
          }}
        />

        <YStack marginTop="$6" width="100%" alignItems="center" justifyContent="center">
          <ChangeImages
            avatar={avatar}
            setAvatar={setAvatar}
            background={background}
            setBackground={setBackground}
            progress={progress}
          />
        </YStack>

        <YStack marginTop="$4" width="100%" alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <YStack width="100%" maxWidth={512}>
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
                <YStack marginBottom="$4" marginTop="$4" flexDirection="column">
                  <FormInputWithIcon
                    icon={
                      <UserIcon
                        size={20}
                        color={isDark ? '$white1' : '$gray11'}
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
                      <Info
                        size={20}
                        color={isDark ? '$white1' : '$gray11'}
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
                      <Mail
                        size={20}
                        color={isDark ? '$white1' : '$gray11'}
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
                        size={20}
                        color={isDark ? '$white1' : '$gray11'}
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
                        size={20}
                        color={isDark ? '$white1' : '$gray11'}
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

                  <XStack marginTop="$4" flexDirection="row" justifyContent="space-between" gap="$4">
                    <TamaguiButton
                      onPress={() => back()}
                      flex={1}
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="$2"
                      paddingHorizontal="$3.5"
                      paddingVertical="$2.5"
                      backgroundColor={isDark ? '$gray8' : '$gray5'}
                      disabled={loading}
                      borderWidth={0}
                    >
                      <P
                        fontWeight="600"
                        color={isDark ? '$white1' : '$gray11'}
                      >
                        Cancel
                      </P>
                    </TamaguiButton>
                    <Button
                      onPress={() => handleSubmit()}
                      text="Update Profile"
                      loading={loading}
                      flex={1}
                      disabled={!isValid || loading}
                    />
                  </XStack>
                </YStack>
              )}
            </Formik>
          </YStack>

          <YStack marginBottom="$20" width="100%" maxWidth={512}>
            <LogOutBtn />
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  )
}
