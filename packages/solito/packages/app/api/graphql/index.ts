// Re-export types from types.ts
export * from './types'

// Define additional types used across the application
export interface PublicUser {
  id: string
  username: string
  displayName: string
  description?: string
  avatarUrl?: string
  publishedAtTimestamp: number | string
  createdAt?: string
  updatedAt?: string
}
