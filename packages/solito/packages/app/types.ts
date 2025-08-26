export interface ErrorType {
  name: string
  message: string
  [key: string]: any
}

export interface SignInForm {
  usernameOrEmail: string
}

export interface SignUpForm {
  username: string
  displayedName: string
  email: string
}

export interface WalletInfo {
  publicAddress: string
  network: string
}

export interface PaymentForm {
  amount: number
}

export interface WithdrawalForm {
  address: string
  amount: string
}

export interface ProfileUpdateForm {
  displayName?: string
  username?: string
  email?: string
  avatarUrl?: string
  backgroundUrl?: string
  twitter?: string
  instagram?: string
}

export type ChangeImage = {
  blob?: Blob
  url: string
}

export type MediaFileInfo =
  | {
      image: true
      uri: string
      width: number
      height: number
    }
  | { image: false; uri: string; mimeType: string }

export type EditProfileForm = {
  displayName: string
  username: string
  email: string
  twitter?: string
  instagram?: string
}

export type Maybe<T> = T | null | undefined
