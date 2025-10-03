'use client'

import { UserDetailScreen } from 'app/features/user/detail-screen'
import { useParams } from 'app/navigation'

export default function Page() {
  const { id } = useParams()
  return <UserDetailScreen id={id as string} />
}
