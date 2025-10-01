/**
 * GraphQL Entry type definitions
 */

/**
 * Entry type representing a music beat or track
 */
export type Entry = {
  id: string
  title: string
  artist: string
  description?: string
  imageUrl?: string
  videoUrl?: string
  likes?: number
  plays?: number
  publishedAt?: number
  userId?: string
  price?: string
  forSale?: boolean
  // Additional fields for player functionality
  albumTitle?: string
  audioUrl?: string
  bpm?: number
  duration?: number
  liked?: boolean
}

/**
 * Entries connection for paginated results
 */
export type EntriesConnection = {
  entries: Entry[]
  cursor: string
}

/**
 * Input type for creating or updating an entry
 */
export type EntryInput = {
  id?: string
  title: string
  artist: string
  description?: string
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string
  price?: string
  forSale?: boolean
  bpm?: number
  albumTitle?: string
}
