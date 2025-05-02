'use client'
import { View, ScrollView, Platform } from 'react-native'
import { Line } from 'app/ui/orSeparator'
import InfoCircle from 'app/ui/icons/info-circle'
import PersonOutline from 'app/ui/icons/person-outline'
import MailOutline from 'app/ui/icons/mail-outline'
import Twitter from 'app/ui/icons/twitter'
import Instagram from 'app/ui/icons/instagram'
import { useEffect, useState } from 'react'
import { User, useUpdateUserMutation } from 'app/api/graphql/mutations'
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

export default function EditProfileScreen({ user }: { user: User }) {
  if (!user) return null;

  const searchParams = useSearchParams();
  const showWithdraw = searchParams?.withdraw === 'true';
  
  const { setUser } = useUserStore();
  const [avatar, setAvatar] = useState<ChangeImage>({
    url: user.avatarUrl,
  });
  const [background, setBackground] = useState<ChangeImage>({
    url: user.backgroundUrl ?? '',
  });
  const [updateUser, { data, loading }] = useUpdateUserMutation();
  const { uploadFile, progress } = useUploadFileToNFTStorage();
  const { back } = useRouter();
  const toast = useToast();

  const handleUpdateUser = async (form: EditProfileForm) => {
    if (loading) return;

    let avatarUrl = user.avatarUrl;
    let backgroundUrl = user.backgroundUrl ?? '';

    try {
      if (avatar.blob) {
        const cid = await uploadFile(avatar.blob);
        avatarUrl = `${ipfsProtocol}${cid}`;
      }

      if (background.blob) {
        const cid = await uploadFile(background.blob);
        backgroundUrl = `${ipfsProtocol}${cid}`;
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
      });

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
        };

        setUser(updatedUser);
        toast?.show({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully!',
        });
        back();
      }
    } catch (error) {
      toast?.show({
        type: 'error',
        title: 'Update Failed',
        message: (error as Error).message || 'Failed to update profile',
      });
    }
  };

  useEffect(() => {
    if (data?.updateUser) {
      back();
    }
  }, [data, back]);

  if (showWithdraw) {
    return <WithdrawCredits />;
  }

  return (
    <SafeAreaView className="bg-black">
      <ScrollView className="w-full bg-black">
        <ProfileHeader
          user={{
            ...user,
            avatarUrl: avatar.url,
            backgroundImage: background.url,
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
            <Line text="Account Information" />
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
                    icon={<PersonOutline className="h-5 w-5 text-white" />}
                    placeholder="Display Name"
                    value={values.displayName}
                    onChangeText={handleChange('displayName')}
                    onBlur={handleBlur('displayName')}
                    error={touched.displayName ? errors.displayName : undefined}
                    editable={!loading}
                  />
                  <FormInputWithIcon
                    icon={<InfoCircle className="h-5 w-5 text-white" />}
                    placeholder="Username"
                    value={values.username}
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    error={touched.username ? errors.username : undefined}
                    editable={!loading}
                  />
                  <FormInputWithIcon
                    icon={<MailOutline className="h-5 w-5 text-white" />}
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
                    icon={<Twitter className="h-5 w-5 text-white" />}
                    placeholder="Twitter username"
                    value={values.twitter}
                    onChangeText={handleChange('twitter')}
                    onBlur={handleBlur('twitter')}
                    error={touched.twitter ? errors.twitter : undefined}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <FormInputWithIcon
                    icon={<Instagram className="h-5 w-5 text-white" />}
                    placeholder="Instagram username"
                    value={values.instagram}
                    onChangeText={handleChange('instagram')}
                    onBlur={handleBlur('instagram')}
                    error={touched.instagram ? errors.instagram : undefined}
                    editable={!loading}
                    autoCapitalize="none"
                  />

                  <Button
                    onPress={() => handleSubmit()}
                    text="Update Profile"
                    loading={loading}
                    className="mt-4"
                    disabled={!isValid || loading}
                  />
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
  );
}
