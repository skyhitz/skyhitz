import * as Yup from 'yup'

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
