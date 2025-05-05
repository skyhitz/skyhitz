import { useParams } from 'solito/navigation'

export function useBeatParam() {
  const { id } = useParams<{ id: string }>()
  return id
}
