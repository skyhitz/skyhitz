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
