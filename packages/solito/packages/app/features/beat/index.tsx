'use client'
import { BeatScreen } from './screen'
import { Entry } from 'app/api/graphql/types'

// Web implementation props - same as the original component
type Props = {
  entry?: Entry
}

// Simple re-export for web - passes through the server-rendered entry if available
export default function BeatScreenWeb({ entry }: Props) {
  return <BeatScreen entry={entry} />
}
