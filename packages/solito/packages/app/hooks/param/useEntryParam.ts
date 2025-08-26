import { useParams } from 'solito/navigation'

export function useEntryParam() {
  const { id } = useParams<{ id: string }>()
  return id
}
