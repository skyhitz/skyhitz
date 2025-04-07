'use client'
import { Text, View, ScrollView, Platform } from 'react-native'
import AccountBox from 'app/ui/icons/account-box'
import { Line } from 'app/ui/orSeparator'
import InfoCircle from 'app/ui/icons/info-circle'
import PersonOutline from 'app/ui/icons/person-outline'
import MailOutline from 'app/ui/icons/mail-outline'
import { useEffect, useState } from 'react'
import { User, useUpdateUserMutation } from 'app/api/graphql'
import { Formik, FormikProps } from 'formik'
import { LogOutBtn } from 'app/features/dashboard/profile/edit/logOutBtn'
import { useUserAtomState } from 'app/state/user'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useRouter } from 'solito/navigation'
import { ChangeImage, EditProfileForm } from 'app/types'
import * as assert from 'assert'
import { editProfileFormSchema } from 'app/validation'
import useUploadFileToNFTStorage from 'app/hooks/useUploadFileToNFTStorage'
import { ipfsProtocol } from 'app/constants/constants'
import { useToast } from 'app/provider/toast'
import Twitter from 'app/ui/icons/twitter'
import Instagram from 'app/ui/icons/instagram'
import { ProfileHeader } from '../ProfileHeader'
import { ChangeImages } from './ChangeImages'
import { Button } from 'app/design/button'

export default function EditProfileScreen({ user }: { user: User }) {
  assert.ok(user, 'Unauthorized access on EditProfileScreen')

  const { setUser } = useUserAtomState()
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
      await updateUser({
        variables: { ...form, avatarUrl, backgroundUrl },
      })
    } catch (e: any) {
      console.error(e)
      toast.show(e?.message ?? 'Unknown error', { type: 'danger' })
    }
  }

  useEffect(() => {
    if (data?.updateUser) {
      if (setUser) setUser(data.updateUser)
      toast.show('Changes successfully saved', { type: 'success' })
      back()
    }
  }, [data, setUser, back, toast])

  const initialValues: EditProfileForm = {
    displayName: user.displayName,
    description: user.description ?? '',
    username: user.username,
    email: user.email,
    twitter: user.twitter ?? '',
    instagram: user.instagram ?? '',
  }

  return (
    <Formik
      initialValues={initialValues}
      validateOnMount
      validationSchema={editProfileFormSchema}
      onSubmit={handleUpdateUser}
    >
      {({
        values,
        handleChange,
        isValid,
        handleSubmit,
        errors,
      }: FormikProps<EditProfileForm>) => (
        <ScrollView className="flex-1">
          <ProfileHeader
            avatar={avatar.url}
            background={background.url}
            displayName={user!.displayName!}
          />

          <View className="mt-10 px-4">
            <ChangeImages
              onAvatarChange={setAvatar}
              onBackgroundChange={setBackground}
              activeSubmission={loading}
            />

            <FormInputWithIcon
              value={values.displayName ?? ''}
              placeholder="Display Name"
              onChangeText={handleChange('displayName')}
              icon={AccountBox}
              editable={!loading}
              error={errors.displayName}
            />
            <Line />
            <FormInputWithIcon
              value={values.description ?? ''}
              placeholder="Description"
              onChangeText={handleChange('description')}
              icon={InfoCircle}
              editable={!loading}
              error={errors.description}
            />
            <Line />
            <FormInputWithIcon
              value={values.username ?? ''}
              placeholder="Username"
              onChangeText={handleChange('username')}
              icon={PersonOutline}
              error={errors.username}
            />
            <Line />
            <FormInputWithIcon
              value={values.twitter ?? ''}
              placeholder="X username"
              onChangeText={handleChange('twitter')}
              icon={Twitter}
              error={errors.twitter}
            />
            <Line />
            <FormInputWithIcon
              value={values.instagram ?? ''}
              placeholder="Instagram username"
              onChangeText={handleChange('instagram')}
              icon={Instagram}
              error={errors.instagram}
            />
            <Text className="pb-2 pt-8 text-sm font-bold">
              Private information
            </Text>
            <FormInputWithIcon
              value={values.email ?? ''}
              placeholder="Email address"
              onChangeText={handleChange('email')}
              icon={MailOutline}
              editable={!loading}
              error={errors.email}
            />
            <Line />
          </View>
          <Text className="px-4 pb-2 pt-8 text-sm font-bold">More</Text>
          <LogOutBtn />
          <View className="mb-5 flex items-center justify-center md:flex-row">
            <Button
              text="Done"
              onPress={handleSubmit}
              className="mb-5 md:mb-0 md:mr-5"
              disabled={!isValid}
              loading={loading || !!progress}
            />
            <Button text="Cancel" variant="secondary" onPress={back} />
          </View>
        </ScrollView>
      )}
    </Formik>
  )
}
