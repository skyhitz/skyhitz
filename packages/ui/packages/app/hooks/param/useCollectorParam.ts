import { useParams } from 'solito/navigation'

export type CollectorParam = {
  id: string
}

export const useCollectorParam = (): string | undefined => {
  const { id } = useParams<CollectorParam>()

  return id
}
