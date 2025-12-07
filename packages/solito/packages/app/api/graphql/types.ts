export interface Entry {
  imageUrl: string
  videoUrl: string
  description?: string
  title: string
  id: string
  artist: string
  tvl?: number
  apr?: number
  escrow?: number
  totalStaked?: number
  publishedAt?: string
  publishedAtTimestamp?: number
}

export interface EntryDetail extends Entry {
  holders?: EntryHolder[]
  history?: EntryActivity[]
  tvl?: number
  apr?: number
  escrow?: number
  totalStaked?: number
}

export interface EntryHolder {
  account: string
  balance: string
}

export interface EntryActivity {
  id: string
  type: number
  ts: number
  accounts?: string[]
  assets?: string[]
  tx: string
  offer?: string
  createdOffer?: string
  amount?: string
  sourceAmount?: string
  price?: ActivityPrice
}

export interface ActivityPrice {
  n: number
  d: number
}

export interface User {
  avatarUrl: string
  backgroundUrl?: string
  displayName?: string
  email: string
  username: string
  id: string
  publishedAt?: string
  version?: number
  jwt?: string
  description?: string
  publicKey: string
  lastPlayedEntry?: Entry
  managed: boolean
  twitter?: string
  instagram?: string
}

export interface PendingUpload {
  id: string
  userId: string
  userEmail: string
  userName: string
  audioHash: string
  imageHash: string
  title: string
  artist: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  createdAtTimestamp: number
  resolvedAt?: string
  resolvedBy?: string
  rejectionReason?: string
  qualityScore?: number
  isAiGenerated?: boolean
}

export interface Curator {
  userId: string
  userEmail: string
  userName: string
  addedAt: string
  addedAtTimestamp: number
  addedBy: string
  addedByName: string
}
