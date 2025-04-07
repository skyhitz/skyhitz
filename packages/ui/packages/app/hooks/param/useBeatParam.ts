import { useParams } from 'solito/navigation'

export type BeatParam = {
  id: string
}

export const useBeatParam = (): string | undefined => {
  const { id } = useParams<BeatParam>()
  return id
}
