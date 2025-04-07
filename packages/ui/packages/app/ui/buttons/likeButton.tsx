import { Pressable } from 'react-native'
import Like from 'app/ui/icons/like'
import {
  Entry,
  useInvestEntryMutation,
  useLikeEntryMutation,
  useUserLikesQuery,
} from 'app/api/graphql'
import useLikeCache from 'app/hooks/useLikeCache'
import { ErrorType } from 'app/types'
import { any } from 'ramda'
import { isSome, lumensToStroops } from 'app/utils'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { useUserAtomState } from 'app/state/user'
import { useToast } from 'app/provider/toast'

type Props = {
  size: number
  className?: string
  entry: Entry
}

function LikeButton({ size, className, entry }: Props) {
  const { user } = useUserAtomState()

  const [likeEntry] = useLikeEntryMutation()
  const toast = useToast()
  const { data: userLikesData } = useUserLikesQuery({ skip: !user })
  const { addLikeToCache, removeLikeFromCache } = useLikeCache()
  const active = any(
    (item) => isSome(item) && item.id === entry.id,
    userLikesData?.userLikes ?? [],
  )
  const [invest] = useInvestEntryMutation()

  const update = async () => {
    if (!user) return
    active ? removeLikeFromCache(entry) : addLikeToCache(entry)
    try {
      console.log('like entry')
      await likeEntry({ variables: { id: entry.id, like: !active } })
      await invest({
        variables: {
          id: entry?.id!,
          amount: lumensToStroops(0.2),
        },
      })
    } catch (e) {
      active ? addLikeToCache(entry) : removeLikeFromCache(entry)

      const err = e as Partial<ErrorType>
      toast.show(err?.message ?? 'Unknown error', { type: 'danger' })
    }
  }

  return (
    <Pressable className={className} onPress={update}>
      <Like
        className={active ? 'text-blue-brand' : 'text-gray-600'}
        size={size}
        fill={active}
      />
    </Pressable>
  )
}

export default function LikeBtn(props: Props) {
  return (
    <ComponentAuthGuard linkToAuth>
      <LikeButton {...props} />
    </ComponentAuthGuard>
  )
}
