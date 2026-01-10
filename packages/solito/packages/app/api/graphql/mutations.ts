import { useMutation, useQuery, useLazyQuery } from '@apollo/client'
import { User } from './types'
import { SecureStorage } from 'app/utils/secure-storage'
import { useUserStore } from 'app/state/user'
import { secureStorage, STORAGE_KEYS } from 'app/services/storage'
import {
  REQUEST_TOKEN,
  SIGN_IN_WITH_TOKEN,
  CREATE_USER_WITH_EMAIL,
  USER_COLLECTION,
  USER_LIKES,
  UPDATE_USER,
  CREATE_PAYMENT_INTENT,
  ENTRIES_SEARCH,
  USERS_SEARCH,
  RECENTLY_ADDED_ENTRIES,
  CLAIM_EARNINGS,
  PENDING_UPLOADS,
  PENDING_UPLOADS_COUNT,
  APPROVE_PENDING_UPLOAD,
  REJECT_PENDING_UPLOAD,
  IS_CURATOR,
  CURATORS,
  ADD_CURATOR,
  REMOVE_CURATOR,
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

// Pending Uploads queries and mutations (curator only)
export function usePendingUploadsQuery() {
  return useQuery(PENDING_UPLOADS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

export function usePendingUploadsCountQuery() {
  return useQuery(PENDING_UPLOADS_COUNT, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

export function useApprovePendingUploadMutation() {
  return useMutation(APPROVE_PENDING_UPLOAD, {
    refetchQueries: [{ query: PENDING_UPLOADS }, { query: PENDING_UPLOADS_COUNT }],
  })
}

export function useRejectPendingUploadMutation() {
  return useMutation(REJECT_PENDING_UPLOAD, {
    refetchQueries: [{ query: PENDING_UPLOADS }, { query: PENDING_UPLOADS_COUNT }],
  })
}

// Curator management hooks
export function useIsCuratorQuery() {
  return useQuery(IS_CURATOR, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

export function useCuratorsQuery() {
  return useQuery(CURATORS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
}

export function useAddCuratorMutation() {
  return useMutation(ADD_CURATOR, {
    refetchQueries: [{ query: CURATORS }],
    awaitRefetchQueries: true,
  })
}

export function useRemoveCuratorMutation() {
  return useMutation(REMOVE_CURATOR, {
    refetchQueries: [{ query: CURATORS }],
    awaitRefetchQueries: true,
  })
}
