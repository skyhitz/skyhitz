import { generateEntryMetadata, EntryPageComponent } from '../../_shared/entry-page'

type Props = {
  params: Promise<{ id: string }>
}

// Re-export the shared metadata generation
export async function generateMetadata(props: Props) {
  return generateEntryMetadata(props)
}

// Re-export the shared component with a specific name
export default async function EntryPage(props: Props) {
  return EntryPageComponent(props)
}