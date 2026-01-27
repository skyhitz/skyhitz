import type { Metadata } from 'next'
import { Config } from 'app/config'
import { usersIndex, entriesIndex } from 'app/api/algolia'
import { PublicUser, Entry } from 'app/api/graphql'
import JsonLdScript from 'app/seo/jsonLd'
import { imageUrlMedium } from 'app/utils/entry'
import { notFound } from 'next/navigation'
import { PublicProfileScreen, PublicUserData } from 'app/features/user/public-profile-screen'

type Props = { params: Promise<{ userId: string }> }

// Enable ISR with 5 minute revalidation
export const revalidate = 300

async function getPublicUser(userId: string): Promise<PublicUserData | null> {
  try {
    const res = await usersIndex.search<PublicUser>('', {
      filters: `objectID:${userId}`,
      attributesToRetrieve: ['*'],
    })
    if (!res.hits[0]) return null
    return res.hits[0] as unknown as PublicUserData
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

async function getUserEntries(userId: string): Promise<Entry[]> {
  try {
    const res = await entriesIndex.search<Entry>('', {
      filters: `creatorId:${userId}`,
      hitsPerPage: 50,
      attributesToRetrieve: ['*'],
    })
    return (res.hits || []) as unknown as Entry[]
  } catch (error) {
    console.error('Error fetching user entries:', error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const user = await getPublicUser(userId)

  if (!user) {
    return {
      title: 'User Not Found | Skyhitz',
      robots: { index: false, follow: false },
    }
  }

  const title = `${user.displayName || user.username} (@${user.username}) | Skyhitz`
  const description =
    user.description || `View ${user.displayName || user.username}'s music NFT collection on Skyhitz`
  const url = `${Config.APP_URL}/users/${user.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      username: user.username,
      images: user.avatarUrl
        ? [
            {
              url: imageUrlMedium(user.avatarUrl),
              width: 480,
              height: 480,
              alt: `${user.displayName || user.username}'s avatar`,
            },
          ]
        : [
            {
              url: `${Config.APP_URL}/icon-128.png`,
              width: 128,
              height: 128,
              alt: 'Skyhitz',
            },
          ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: user.avatarUrl
        ? [{ url: imageUrlMedium(user.avatarUrl), alt: `${user.displayName}'s avatar` }]
        : [{ url: `${Config.APP_URL}/icon-128.png`, alt: 'Skyhitz' }],
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicUserPage({ params }: Props) {
  const { userId } = await params

  // Fetch user and entries in parallel
  const [user, entries] = await Promise.all([getPublicUser(userId), getUserEntries(userId)])

  if (!user) {
    return notFound()
  }

  return (
    <>
      <PublicProfileScreen user={user} entries={entries} />
      <JsonLdScript collector={user as any} />
    </>
  )
}
