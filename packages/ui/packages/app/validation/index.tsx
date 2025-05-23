import * as Yup from 'yup'
import { object, SchemaOf, string } from 'yup'
import {
  CreateOfferForm,
  EditProfileForm,
  MediaFileInfo,
  MintForm,
  SignInForm,
  WithdrawForm,
} from 'app/types'

export const usernameSchema = Yup.string()
  .required('Username is required.')
  .min(2, 'Username is minimum 2 characters.')
  .matches(
    /^[a-z0-9_-]+$/,
    'Usernames cannot have spaces, special characters or capital letters',
  )

export const displayedNameSchema = Yup.string()
  .required('Display name is required.')
  .min(2, 'Display name is minimum 2 characters.')

export const emailSchema = Yup.string()
  .required('Email is required')
  .email('Please enter a valid email.')

export const editProfileFormSchema: SchemaOf<EditProfileForm> = object().shape({
  displayName: displayedNameSchema,
  description: string().max(
    280,
    'Description can contain up to 280 characters',
  ),
  username: usernameSchema,
  email: emailSchema,
  twitter: string()
    .min(4, 'Twitter username cannot be shorter than 4 characters')
    .max(15, 'Twitter username cannot be longer than 15 characters')
    .nullable(),
  instagram: string()
    .min(1, 'Instagram username cannot be shorter than 1 character')
    .max(30, 'Instagram username cannot be longer than 30 characters')
    .nullable(),
})

export const signInFormSchema: SchemaOf<SignInForm> = Yup.object().shape({
  usernameOrEmail: emailSchema,
})

export const signUpFormSchema = Yup.object().shape({
  username: usernameSchema,
  displayedName: displayedNameSchema,
  email: emailSchema,
})

export const topUpFormSchema = Yup.object().shape({
  email: emailSchema,
  amount: Yup.number()
    .typeError('Must be a number')
    .required('Amount is required')
    .min(10, 'Minimal amount to top up is 10 USD')
    .max(1000, 'Maximum amount to top up is 1000 USD'),
})

export const mintFormSchema: SchemaOf<MintForm> = object().shape({
  artist: Yup.string()
    .required('Artist name is required')
    .min(2, 'Artist name should contain at least 2 characters')
    .max(20, 'Artist name should not contain more than 20 characters'),
  title: Yup.string()
    .required('Title is required')
    .min(2, 'Title should contain at least 2 characters')
    .max(20, 'Title should not contain more than 20 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(2, 'Description should contain at least 2 characters')
    .max(100, 'Description should not contain more than 100 characters'),
  availableForSale: Yup.boolean().required(),
  price: Yup.string(),
  equityForSale: Yup.number()
    .min(1, 'Equity should be within range 0 - 100')
    .max(100, 'Equity should be within range 0 - 100'),
})

export const createOfferSchema: SchemaOf<CreateOfferForm> = object().shape({
  price: Yup.string(),
  equityForSale: Yup.number()
    .min(1, 'Equity should be within range 0 - 100')
    .max(100, 'Equity should be within range 0 - 100'),
})

export const withdrawFormSchema: (
  currentBalance: number,
) => SchemaOf<WithdrawForm> = (currentBalance: number) => {
  return object().shape({
    address: Yup.string().required('Stellar Address is required'),
    amount: Yup.number()
      .required('Amount is required')
      .min(1, 'Minimal amount to withdraw is 1XLM')
      .max(currentBalance, "You can't withdraw more than your balance"),
  })
}

const ASPECT_RATIO_MIN = 0.99
const ASPECT_RATIO_MAX = 1.01
const validateImgSquare = (image: MediaFileInfo) => {
  if (!image.image) {
    return 'File is not an image!'
  }
  const aspectRatio = image.width / image.height
  if (aspectRatio < ASPECT_RATIO_MIN || aspectRatio > ASPECT_RATIO_MAX) {
    return 'Only square images supported!'
  }
  return null
}

const BACKGROUND_ASPECT_RATIO_MIN = 2
const BACKGROUND_ASPECT_RATIO_MAX = 3
const validateBackgroundRatio = (background: MediaFileInfo) => {
  if (!background.image) {
    return 'File is not an image!'
  }
  const aspectRatio = background.width / background.height
  if (
    aspectRatio < BACKGROUND_ASPECT_RATIO_MIN ||
    aspectRatio > BACKGROUND_ASPECT_RATIO_MAX
  ) {
    return `Only aspect ratios from ${BACKGROUND_ASPECT_RATIO_MIN}:1 to ${BACKGROUND_ASPECT_RATIO_MAX}:1 are supported`
  }
  return null
}

const validateImgFormatOneOf = (image: MediaFileInfo, formats = ['png']) => {
  for (const format of formats) {
    if (image.uri.startsWith(`data:image/${format}`)) return null
    if (image.uri.endsWith(`.${format}`)) return null
  }

  return 'Unsupported image format'
}

const validateImgWideEnough = (image: MediaFileInfo, minWidth = 3000) => {
  if (!image.image) {
    return 'File is not an image!'
  }
  if (image.width < minWidth) {
    return `Image should be at least ${minWidth}px wide!`
  }
  return null
}

export const validateProfilePicture = (image: MediaFileInfo): string | null => {
  return (
    validateImgSquare(image) ??
    validateImgFormatOneOf(image, ['png', 'jpg', 'jpeg'])
  )
}

export const validateBackgroundImage = (
  background: MediaFileInfo,
): string | null => {
  return (
    validateBackgroundRatio(background) ??
    validateImgFormatOneOf(background, ['png', 'jpg', 'jpeg'])
  )
}

export const validateArtwork = (image: MediaFileInfo): string | null => {
  return (
    validateImgSquare(image) ??
    validateImgFormatOneOf(image) ??
    validateImgWideEnough(image)
  )
}

export const SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'audio/mp4',
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/vnd.wave',
  'audio/wave',
  'audio/x-wav',
]
export const validateVideo = (video: MediaFileInfo): string | null => {
  if (video.image || !SUPPORTED_MIME_TYPES.includes(video.mimeType)) {
    return 'Supported media formats: .mp4, .wav, .mp3'
  }
  return null
}
