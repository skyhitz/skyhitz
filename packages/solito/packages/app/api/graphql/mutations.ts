import { User } from './types'

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
    user?: User
  }
}

// Mock implementations of mutation hooks for use during development
export function useRequestTokenMutation(options?: { 
  onCompleted?: () => void 
}): [
  (variables: { variables: RequestTokenMutationVariables }) => Promise<any>,
  { loading: boolean; error: Error | null }
] {
  const requestToken = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (options?.onCompleted) {
      options.onCompleted()
    }
    return { data: { requestToken: true } }
  }

  return [requestToken, { loading: false, error: null }]
}

export function useSignInWithTokenMutation(): [
  (variables: { variables: SignInWithTokenMutationVariables }) => Promise<any>,
  { loading: boolean; error: Error | null }
] {
  const signIn = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock successful authentication response
    return {
      data: {
        signInWithToken: {
          id: '1234',
          displayName: 'Test User',
          email: 'test@example.com',
          username: 'testuser',
          jwt: 'mock-jwt-token',
          publicKey: 'mock-public-key'
        }
      }
    }
  }

  return [signIn, { loading: false, error: null }]
}

export function useCreateUserWithEmailMutation(): [
  (variables: { variables: CreateUserWithEmailMutationVariables }) => Promise<any>,
  { loading: boolean; error: Error | null; data: CreateUserWithEmailResponse | null }
] {
  const createUser = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock successful registration response
    return {
      data: {
        createUserWithEmail: {
          user: null // User is null on successful registration, they need to verify email
        }
      }
    }
  }

  return [createUser, { loading: false, error: null, data: null }]
}
