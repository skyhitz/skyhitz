import { EntryScreen } from 'app/features/entry/screen'

export default function MusicPage({ params }: { params: { id: string } }) {
  return <EntryScreen id={params.id} entry={null} />
}

export const metadata = {
  title: 'Music - Skyhitz',
}

