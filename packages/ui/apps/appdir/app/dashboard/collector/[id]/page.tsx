/** @jsxImportSource react */

import type { Metadata } from 'next'
import CollectorScreen from 'app/features/dashboard/collector'
import { combinedTitle } from 'app/constants/content'
import { usersIndex } from 'app/api/algolia'
import { isEmpty } from 'ramda'
import { PublicUser } from 'app/api/graphql'
import { imageUrlMedium } from 'app/utils/entry'
import { Config } from 'app/config'
import JsonLdScript from 'app/seo/jsonLd'
import { redirect } from 'next/navigation'

type Props = {
  params: { id: string }
}

const getUser = async (id: string) => {
  const res = await usersIndex.search<PublicUser>('', {
    filters: `id:${id}`,
    cacheable: true,
  })

  if (isEmpty(res.hits)) {
    return null
  }

  return res.hits[0] as unknown as PublicUser
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const id = params.id

  // fetch data
  const user = await getUser(id)

  if (!user) {
    return {
      title: combinedTitle,
    }
  }

  const url = `${Config.APP_URL}/dashboard/collector/${user.id}`

  return {
    title: user.username,
    description: user.description,
    twitter: {
      card: 'summary',
      title: user.username,
      images: {
        url: `${imageUrlMedium(user.avatarUrl)}`,
      },
    },
    openGraph: {
      title: user.username,
      description: user.description ? user.description : '',
      images: [
        {
          type: 'image/png',
          width: 480,
          height: 480,
          url: `${imageUrlMedium(user.avatarUrl)}`,
        },
      ],
      url: url,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function BeatmakerPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getUser(params.id)

  if (!user) {
    return redirect('/dashboard/search')
  }

  return (
    <>
      <CollectorScreen />
      <JsonLdScript collector={user} />
    </>
  )
}
