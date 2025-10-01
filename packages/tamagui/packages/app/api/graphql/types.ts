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
}

export interface EntryDetail extends Entry {
  holders?: EntryHolder[]
  history?: EntryActivity[]
  tvl?: number
  apr?: number
  escrow?: number
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
