import type { Metadata } from 'next'
import { Config } from 'app/config'
import { usersIndex } from 'app/api/algolia'
import { PublicUser } from 'app/api/graphql'
import JsonLdScript from 'app/seo/jsonLd'
import { imageUrlMedium } from 'app/utils/entry'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ userId: string }> }

async function getPublicUser(userId: string) {
  const res = await usersIndex.search<PublicUser>('', {
    filters: `objectID:${userId}`,
    attributesToRetrieve: ['*'],
  })
  if (!res.hits[0]) return null
  return res.hits[0] as unknown as PublicUser
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const user = await getPublicUser(userId)
  if (!user) return { title: 'Skyhitz' }
  const title = `${user.displayName} (@${user.username}) | Skyhitz`
  const description = user.description || `View ${user.displayName}'s profile on Skyhitz`
  const url = `${Config.APP_URL}/users/${user.id}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: user.avatarUrl
        ? [
            {
              url: imageUrlMedium(user.avatarUrl),
              width: 480,
              height: 480,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: user.avatarUrl ? [{ url: imageUrlMedium(user.avatarUrl) }] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicUserPage({ params }: Props) {
  const { userId } = await params
  const user = await getPublicUser(userId)
  if (!user) return notFound()
  return <JsonLdScript collector={user} />
}
