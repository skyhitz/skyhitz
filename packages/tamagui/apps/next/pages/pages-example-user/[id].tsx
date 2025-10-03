import { UserDetailScreen } from 'app/features/user/detail-screen'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Page() {
  const { query } = useRouter()
  const id = query.id as string
  return (
    <>
      <Head>
        <title>User</title>
      </Head>
      <UserDetailScreen id={id} />
    </>
  )
}
