import { useMutation, useQuery, useLazyQuery } from '@apollo/client'
import { User } from './types'
import { SecureStorage } from 'app/utils/secure-storage'
import { useUserStore } from 'app/state/user'
import { secureStorage, STORAGE_KEYS } from 'app/services/storage'
import {
  REQUEST_TOKEN,
  SIGN_IN_WITH_TOKEN,
  CREATE_USER_WITH_EMAIL,
  USER_CREDITS,
  USER_COLLECTION,
  USER_LIKES,
  UPDATE_USER,
  WITHDRAW_TO_EXTERNAL_WALLET,
  CREATE_PAYMENT_INTENT,
  ENTRIES_SEARCH,
  USERS_SEARCH,
  RECENTLY_ADDED_ENTRIES,
  CLAIM_EARNINGS
} from './operations'

// Define GraphQL mutation types
export type RequestTokenMutationVariables = {
  usernameOrEmail: string
}

export type SignInWithTokenMutationVariables = {
  uid: string
  token: string
}

export type CreateUserWithEmailMutationVariables = {
  username: string
  displayName: string
  email: string
  signedXDR?: string
}

export type CreateUserWithEmailResponse = {
  createUserWithEmail: {
    message: string
    user?: User
  }
}

export type UpdateUserMutationVariables = {
  displayName?: string
  username?: string
  email?: string
  avatarUrl?: string
  backgroundUrl?: string
  twitter?: string
  instagram?: string
}

export type WithdrawToExternalWalletMutationVariables = {
  address: string
}

export type CreatePaymentIntentMutationVariables = {
  amount: number
}

export type CreatePaymentIntentResponse = {
  createPaymentIntent: {
    clientSecret: string
  }
}

// Real GraphQL mutation hooks that connect to the backend
export function useRequestTokenMutation(options?: { 
  onCompleted?: () => void 
}) {
  return useMutation(REQUEST_TOKEN, {
    onCompleted: (data) => {
      if (data?.requestToken && options?.onCompleted) {
        options.onCompleted()
      }
    },
  })
}

export function useSignInWithTokenMutation() {
  // Get the setUser function from the Zustand store
  const { setUser } = useUserStore()
  
  return useMutation(SIGN_IN_WITH_TOKEN, {
    onCompleted: async (data) => {
      console.log('Sign in with token succeeded:', data?.signInWithToken)
      
      if (data?.signInWithToken) {
        // Store JWT token in secure storage
        if (data.signInWithToken.jwt) {
          await SecureStorage.save('auth-token', data.signInWithToken.jwt)
        }
        
        // Update the user in the Zustand store
        setUser(data.signInWithToken)
        
        // Also save user data to secure storage for offline access
        await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.signInWithToken))
      }
    },
  })
}

export function useCreateUserWithEmailMutation() {
  return useMutation(CREATE_USER_WITH_EMAIL)
}


// User data queries
export function useUserCreditsQuery() {
  return useQuery(USER_CREDITS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

export function useUserCollectionQuery(userId: string) {
  return useQuery(USER_COLLECTION, {
    variables: { userId },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

export function useUserLikesQuery() {
  return useQuery(USER_LIKES, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

// User update mutations
export function useUpdateUserMutation() {
  return useMutation(UPDATE_USER)
}

export function useWithdrawToExternalWalletMutation() {
  return useMutation(WITHDRAW_TO_EXTERNAL_WALLET)
}

// Claim earnings mutation
export function useClaimEarningsMutation() {
  return useMutation(CLAIM_EARNINGS)
}

// Payment mutation
export function useCreatePaymentIntentMutation() {
  return useMutation(CREATE_PAYMENT_INTENT)
}

// Search queries
export function useEntriesSearchLazyQuery() {
  return useLazyQuery(ENTRIES_SEARCH)
}

export function useUsersSearchLazyQuery() {
  return useLazyQuery(USERS_SEARCH)
}

export function useRecentlyAddedEntriesQuery() {
  return useQuery(RECENTLY_ADDED_ENTRIES, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}
