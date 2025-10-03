import { useParams } from 'app/navigation'

export function useEntryParam() {
  const { id } = useParams<{ id: string }>()
  return id
}
