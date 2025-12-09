import { gql } from '@apollo/client'

// Investment operations
export const INVEST_ENTRY = gql`
  mutation InvestEntry($id: String!, $amount: Float!) {
    investEntry(id: $id, amount: $amount) {
      success
      message
    }
  }
`

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
      verifiedArtist
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

export const USER_HITZ_BALANCE = gql`
  query UserHitzBalance {
    userHitzBalance
  }
`

// Market data
export const HITZ_PRICE_XLM = gql`
  query HitzPriceXlm {
    hitzPriceXlm
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

// Like operations
export const LIKE_ENTRY = gql`
  mutation LikeEntry($id: String!, $like: Boolean!) {
    likeEntry(id: $id, like: $like)
  }
`

export const ENTRY_LIKES = gql`
  query EntryLikes($id: String!) {
    entryLikes(id: $id) {
      users {
        id
        username
        displayName
        avatarUrl
        description
      }
    }
  }
`

export const SET_LAST_PLAYED_ENTRY = gql`
  mutation setLastPlayedEntry($entryId: String!) {
    setLastPlayedEntry(entryId: $entryId)
  }
`

// External music search
export const SEARCH_EXTERNAL_MUSIC = gql`
  query SearchExternalMusic($query: String!, $limit: Int, $offset: Int) {
    searchExternalMusic(query: $query, limit: $limit, offset: $offset) {
      id
      title
      artist
      genre
      source
      url
      imageUrl
    }
  }
`

// External audio url resolver
export const EXTERNAL_AUDIO_URL = gql`
  query ExternalAudioUrl($id: String!) {
    externalAudioUrl(id: $id)
  }
`

// Mine and index external entry
export const MINE_EXTERNAL_ENTRY = gql`
  mutation MineExternalEntry($input: ExternalTrackInput!) {
    mineExternalEntry(input: $input) {
      imageUrl
      videoUrl
      description
      title
      id
      artist
    }
  }
`

// Preview claimable earnings without invoking claim on-chain
export const CLAIMABLE_EARNINGS_PREVIEW = gql`
  query ClaimableEarningsPreview {
    claimableEarningsPreview {
      success
      message
      totalClaimedAmount
    }
  }
`

export const UNSTAKE_ENTRY = gql`
  mutation UnstakeEntry($id: String!, $amount: Float!) {
    unstakeEntry(id: $id, amount: $amount) {
      success
      message
      unstakedAmount
    }
  }
`

export const WITHDRAW_HITZ = gql`
  mutation WithdrawHitz($address: String!, $amount: Float!) {
    withdrawHitz(address: $address, amount: $amount) {
      success
      message
      amount
      txHash
    }
  }
`

// Record user actions (stream, like, download, mine, invest)
export const RECORD_ACTION = gql`
  mutation RecordAction($id: String!, $action: String!) {
    recordAction(id: $id, action: $action) {
      success
      message
      fee
    }
  }
`

// Pending Uploads (curator only)
export const PENDING_UPLOADS = gql`
  query PendingUploads {
    pendingUploads {
      id
      userId
      userEmail
      userName
      audioHash
      imageHash
      title
      artist
      description
      isVerifiedArtist
      artistEquityBps
      status
      createdAt
      createdAtTimestamp
    }
  }
`

export const PENDING_UPLOADS_COUNT = gql`
  query PendingUploadsCount {
    pendingUploadsCount
  }
`

export const APPROVE_PENDING_UPLOAD = gql`
  mutation ApprovePendingUpload($input: ApprovePendingUploadInput!) {
    approvePendingUpload(input: $input) {
      success
      message
      entry {
        id
        title
        artist
        imageUrl
        videoUrl
      }
    }
  }
`

export const REJECT_PENDING_UPLOAD = gql`
  mutation RejectPendingUpload($id: String!, $reason: String) {
    rejectPendingUpload(id: $id, reason: $reason)
  }
`

// Curator management
export const IS_CURATOR = gql`
  query IsCurator {
    isCurator
  }
`

export const CURATORS = gql`
  query Curators {
    curators {
      userId
      userEmail
      userName
      addedAt
      addedAtTimestamp
      addedBy
      addedByName
    }
  }
`

export const ADD_CURATOR = gql`
  mutation AddCurator($email: String!) {
    addCurator(input: { email: $email }) {
      success
      message
      curator {
        userId
        userEmail
        userName
        addedAt
        addedByName
      }
    }
  }
`

export const REMOVE_CURATOR = gql`
  mutation RemoveCurator($userId: String!) {
    removeCurator(input: { userId: $userId }) {
      success
      message
    }
  }
`
