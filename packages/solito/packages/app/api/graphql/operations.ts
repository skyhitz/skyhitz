import { gql } from '@apollo/client'

// Authentication mutations
export const REQUEST_TOKEN = gql`
  mutation RequestToken($usernameOrEmail: String!) {
    requestToken(usernameOrEmail: $usernameOrEmail)
  }
`

export const SIGN_IN_WITH_TOKEN = gql`
  mutation SignInWithToken($uid: String!, $token: String!) {
    signInWithToken(uid: $uid, token: $token) {
      avatarUrl
      backgroundUrl
      displayName
      email
      username
      id
      jwt
      description
      publicKey
      managed
      twitter
      instagram
      lastPlayedEntry {
        imageUrl
        videoUrl
        description
        title
        id
        artist
      }
    }
  }
`

export const CREATE_USER_WITH_EMAIL = gql`
  mutation CreateUserWithEmail(
    $displayName: String!
    $email: String!
    $username: String!
    $signedXDR: String
  ) {
    createUserWithEmail(
      displayName: $displayName
      email: $email
      username: $username
      signedXDR: $signedXDR
    ) {
      message
      user {
        avatarUrl
        displayName
        username
        id
        jwt
        publishedAt
        email
        description
        publicKey
        managed
        lastPlayedEntry {
          imageUrl
          videoUrl
          description
          title
          id
          artist
        }
      }
    }
  }
`

// User data queries

export const USER_CREDITS = gql`
  query UserCredits {
    userCredits
  }
`

export const USER_COLLECTION = gql`
  query UserCollection($userId: String!) {
    userEntries(userId: $userId) {
      imageUrl
      videoUrl
      description
      title
      id
      artist
    }
  }
`

export const USER_LIKES = gql`
  query UserLikes {
    userLikes {
      imageUrl
      videoUrl
      description
      title
      id
      artist
    }
  }
`

// User update mutations
export const UPDATE_USER = gql`
  mutation UpdateUser(
    $displayName: String
    $username: String
    $email: String
    $avatarUrl: String
    $backgroundUrl: String
    $twitter: String
    $instagram: String
  ) {
    updateUser(
      displayName: $displayName
      username: $username
      email: $email
      avatarUrl: $avatarUrl
      backgroundUrl: $backgroundUrl
      twitter: $twitter
      instagram: $instagram
    ) {
      avatarUrl
      backgroundUrl
      displayName
      email
      username
      id
      description
      publicKey
      managed
      twitter
      instagram
    }
  }
`

export const WITHDRAW_TO_EXTERNAL_WALLET = gql`
  mutation WithdrawToExternalWallet($address: String!) {
    withdrawToExternalWallet(address: $address)
  }
`

// Payment mutation
export const CREATE_PAYMENT_INTENT = gql`
  mutation CreatePaymentIntent($amount: Int!) {
    createPaymentIntent(amount: $amount) {
      clientSecret
    }
  }
`

// Entries search
export const ENTRIES_SEARCH = gql`
  query EntriesSearch($query: String!) {
    entriesSearch(query: $query) {
      imageUrl
      videoUrl
      description
      title
      id
      artist
    }
  }
`

export const USERS_SEARCH = gql`
  query UsersSearch($query: String!) {
    usersSearch(query: $query) {
      avatarUrl
      displayName
      username
      id
      description
      twitter
      instagram
    }
  }
`

export const RECENTLY_ADDED_ENTRIES = gql`
  query RecentlyAddedEntries {
    recentlyAddedEntries {
      imageUrl
      videoUrl
      description
      title
      id
      artist
    }
  }
`

export const CLAIM_EARNINGS = gql`
  mutation ClaimEarnings {
    claimEarnings {
      success
      message
      totalClaimedAmount
      lastClaimTime
    }
  }
`
