// Common types for DownloadBtn
import { Entry } from 'app/api/graphql/types'

export interface DownloadButtonProps {
  size?: number
  className?: string
  entry: Entry
}
