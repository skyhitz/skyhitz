export const Schema = `
type Query {
  entry(id: String!, bypassCache: Boolean): EntryDetails!
  entryLikes(id: String!): EntryLikes!
  userCredits: Float!
  userEntries(userId: String!): [Entry!]!
  userLikes: [Entry!]!
  xlmPrice: String!
}

type Mutation {
  createUserWithEmail(
    displayName: String!
    email: String!
    username: String!
    signedXDR: String
  ): ConditionalUser!
  createPaymentIntent(amount: Int!): PaymentIntentResponse!
  checkPendingWithdrawals: Boolean!
  investEntry(id: String!, amount: Float!): ConditionalXDR!
  likeEntry(id: String!, like: Boolean!): Boolean!
  processEntry(
    contract: String!
    tokenId: String!
    network: String!
  ): Entry!
  removeEntry(id: String!): Boolean!
  requestToken(usernameOrEmail: String!): Boolean!
  setLastPlayedEntry(entryId: String!): Boolean!
  signInWithToken(token: String!, uid: String!): User!
  updateUser(
    avatarUrl: String
    backgroundUrl: String
    displayName: String
    description: String
    username: String
    email: String
    twitter: String
    instagram: String
  ): User!
  withdrawToExternalWallet(address: String!, amount: Int!): Boolean!
  initContract: InitContractResult!
  submitLink(link: String!, email: String!): SubmitLinkResponse!
  claimEarnings: ClaimEarningsResponse!
}

type PaymentIntentResponse {
  clientSecret: String!
}

type InitContractResult {
  success: Boolean!
  message: String!
  entries: [Entry!]!
}

type decentralizeMetaRes {
  media: String!
  metadata: String!
  contract: String!
  tokenId: String!
  network: String!
}

type IpfsRes {
  IpfsHash: String!
  PinSize: Int!
  Timestamp: String!
}

type User {
  avatarUrl: String!
  backgroundUrl: String
  displayName: String
  email: String!
  username: String!
  id: String!
  publishedAt: String
  version: Int
  jwt: String
  description: String
  publicKey: String!
  lastPlayedEntry: Entry
  managed: Boolean!
  twitter: String
  instagram: String
}

type Entry {
  imageUrl: String!
  videoUrl: String!
  description: String
  title: String!
  id: String!
  artist: String!
}

type EntryLikes {
  count: Int!
  users: [PublicUser]
}

type PublicUser {
  avatarUrl: String!
  displayName: String
  username: String!
  id: String!
  description: String
}

type EntryPrice {
  price: String!
  amount: String!
}

type EntryDetails {
  imageUrl: String!
  videoUrl: String!
  description: String
  title: String!
  id: String!
  artist: String!
  holders: [EntryHolder!]
  history: [EntryActivity!]
  tvl: Float
	apr: Float
	escrow: Float
}

type EntryHolder {
  account: String!
  balance: String!
}

type EntryActivity {
  id: String!
  type: Int!
  ts: Int!
  accounts: [String]
  assets: [String]
  tx: String!
  offer: String
  createdOffer: String
  amount: String
  sourceAmount: String
  price: ActivityPrice
}

type ActivityPrice {
  n: Int!
  d: Int!
}

type Token {
  token: String!
}

type ConditionalXDR {
  xdr: String
  success: Boolean!
  submitted: Boolean!
  message: String
  exists: Boolean
  publicKey: String!
}

type ConditionalUser {
  user: User
  message: String!
}

type AccountCredits {
  credits: Float!
}

type Offer {
  id: String!
  seller: String!
  selling: Asset!
  buying: Asset!
  amount: String!
  price: String!
}

type Asset {
  asset_type: String!
  asset_code: String
  asset_issuer: String
}

type SubmitLinkResponse {
    message: String!
    success: Boolean!
}

type ClaimEarningsResponse {
    success: Boolean!
    totalClaimedAmount: Float!
    claimedEntries: [ClaimedEntry!]!
    message: String
    lastClaimTime: String
}

type ClaimedEntry {
    entryId: String!
    amount: Float!
}
`;
