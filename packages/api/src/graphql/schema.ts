export const Schema = `
type Query {
  entry(id: String!, bypassCache: Boolean): EntryDetails!
  entryLikes(id: String!): EntryLikes!
  userCredits: Float!
  userHitzBalance: Float!
  hitzPriceXlm: Float!
  userEntries(userId: String!): [Entry!]!
  userLikes: [Entry!]!
  xlmPrice: String!
  searchExternalMusic(query: String!, limit: Int, offset: Int): [ExternalTrack!]!
  externalAudioUrl(id: String!): String
  claimableEarningsPreview: ClaimEarningsResponse!
  pendingMines: [PendingMine!]!
  pendingMine(id: String!): PendingMine!
  pendingUploads: [PendingUpload!]!
  pendingUploadsCount: Int!
  pendingUpload(id: String!): PendingUpload!
  isCurator: Boolean!
  curators: [Curator!]!
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
  withdrawToExternalWallet(address: String!, amount: Float!): Boolean!
  submitLink(link: String!, email: String!): SubmitLinkResponse!
  claimEarnings: ClaimEarningsResponse!
  mineExternalEntry(input: ExternalTrackInput!): Entry!
  unstakeEntry(id: String!, amount: Float!): UnstakeResponse!
  withdrawHitz(address: String!, amount: Float!): WithdrawHitzResponse!
  mergeEntries(fromId: String!, toId: String!): Boolean!
  recordAction(id: String!, action: String!): RecordActionResponse!
  approvePendingMine(id: String!): ApprovePendingMineResponse!
  mergePendingMine(id: String!, targetEntryId: String!): MergePendingMineResponse!
  rejectPendingMine(id: String!): Boolean!
  approvePendingUpload(input: ApprovePendingUploadInput!): ApprovePendingUploadResponse!
  rejectPendingUpload(id: String!, reason: String): Boolean!
  addCurator(input: AddCuratorInput!): AddCuratorResponse!
  removeCurator(input: RemoveCuratorInput!): RemoveCuratorResponse!
  # REMOVED: sellShares - no longer supported in new contract
  # Users can only invest/stake/unstake, not sell stakes
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

type UnstakeResponse {
  success: Boolean!
  message: String!
  unstakedAmount: Float!
}

type WithdrawHitzResponse {
  success: Boolean!
  message: String!
  amount: Float!
  txHash: String
}

type RecordActionResponse {
    success: Boolean!
    message: String!
    fee: Float!
}

type ExternalTrack {
  id: String!
  title: String!
  artist: String
  genre: String
  source: String!
  url: String
  imageUrl: String
}

input ExternalTrackInput {
  id: String!
  title: String!
  artist: String
  genre: String
  source: String!
  url: String
  imageUrl: String
}

type PendingMine {
  id: String!
  userId: String!
  userEmail: String!
  userName: String!
  track: PendingMineTrack!
  similarTracks: [SimilarTrackInfo!]!
  status: String!
  createdAt: String!
  createdAtTimestamp: Int!
  resolvedAt: String
  resolvedBy: String
  mergedToId: String
}

type PendingMineTrack {
  id: String!
  title: String!
  artist: String
  genre: String
  source: String!
  url: String
  imageUrl: String
}

type SimilarTrackInfo {
  id: String!
  title: String!
  artist: String
  similarity: Float!
}

type ApprovePendingMineResponse {
  success: Boolean!
  message: String!
  entry: Entry
}

type MergePendingMineResponse {
  success: Boolean!
  message: String!
  mergedToEntryId: String
}

type PendingUpload {
  id: String!
  userId: String!
  userEmail: String!
  userName: String!
  audioHash: String!
  imageHash: String!
  title: String!
  artist: String!
  description: String
  status: String!
  createdAt: String!
  createdAtTimestamp: Int!
  resolvedAt: String
  resolvedBy: String
  rejectionReason: String
  qualityScore: Int
  isAiGenerated: Boolean
}

input ApprovePendingUploadInput {
  id: String!
  starRating: Int!
  isAiGenerated: Boolean!
}

type ApprovePendingUploadResponse {
  success: Boolean!
  message: String!
  entry: Entry
}

type Curator {
  userId: String!
  userEmail: String!
  userName: String!
  addedAt: String!
  addedAtTimestamp: Int!
  addedBy: String!
  addedByName: String!
}

input AddCuratorInput {
  email: String!
}

type AddCuratorResponse {
  success: Boolean!
  message: String!
  curator: Curator
}

input RemoveCuratorInput {
  email: String!
}

type RemoveCuratorResponse {
  success: Boolean!
  message: String!
}
`;
