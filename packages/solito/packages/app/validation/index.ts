import * as Yup from 'yup'
import { object, string, number } from 'yup'
import { EditProfileForm, WithdrawalForm } from 'app/types'

// Reusable schemas
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

// Form schemas
export const editProfileFormSchema = object().shape({
  displayName: displayedNameSchema,
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

export const withdrawFormSchema = (currentBalance: number) => {
  return object().shape({
    address: Yup.string()
      .required('Stellar Address is required')
      .matches(/^[A-Z0-9]+$/, 'Stellar address can only contain uppercase letters and numbers')
      .test('valid-address-length', 'Stellar address must be either 56 characters (standard) or 69 characters (muxed)', (value) => {
        return value.length === 56 || value.length === 69;
      }),
    amount: Yup.string()
      .required('Amount is required')
      .test('min-amount', 'Minimal amount to withdraw is 5 XLM', (value) => {
        const numValue = Number(value);
        return !isNaN(numValue) && numValue >= 5;
      })
      .test('max-amount', "You can't withdraw more than your balance", (value) => {
        const numValue = Number(value);
        return !isNaN(numValue) && numValue <= currentBalance;
      }),
  })
}

export const topUpFormSchema = object().shape({
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email.'),
  amount: Yup.number()
    .required('Amount is required')
    .min(1, 'Minimum amount to top-up is 1 USD')
    .max(1000, 'Maximum amount to top-up is 1000 USD')
})

export const signInFormSchema = Yup.object().shape({
  usernameOrEmail: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),
})

export const signUpFormSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  displayedName: Yup.string()
    .required('Display name is required')
    .min(3, 'Display name must be at least 3 characters'),
  
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),
})
