import type { Metadata } from 'next'
import { PostScreen } from 'app/features/post/screen'
import { Post } from 'app/types'
import { isEmpty } from 'ramda'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { combinedTitle } from 'app/constants/content'
import { imageUrlMedium } from 'app/utils/entry'
import { Config } from 'app/config'
import JsonLdScript from 'app/seo/jsonLd'

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const { slug } = await params

  // fetch data
  const post = await getPost(slug)

  if (!post) {
    return {
      title: combinedTitle,
    }
  }

  const description = post.content
    .replace(/<\/?[^>]+(>|$)/g, '')
    .split('. ', 1)[0]

  const url = `${Config.APP_URL}/blog/${post.slug}`

  return {
    title: post.title,
    description: description,
    twitter: {
      card: 'summary',
      title: post.title,
      images: {
        url: `${imageUrlMedium(post.imageUrl)}`,
      },
    },
    openGraph: {
      title: post.title,
      description: description,
      images: [
        {
          type: 'image/png',
          width: 480,
          height: 480,
          url: `${imageUrlMedium(post.imageUrl)}`,
        },
      ],
      url: url,
    },
    alternates: {
      canonical: url,
    },
  }
}

const getPost = async (slug: string) => {
  try {
    const response = await algoliaClient.searchSingleIndex({
      indexName: indexNames.blog,
      searchParams: {
        query: '',
        filters: `objectID:${slug}`,
      },
    })

    if (isEmpty(response.hits)) {
      return {} as Post
    }

    return response.hits[0] as unknown as Post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return {} as Post
  }
}

export default async function BlogPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = await params
  const post = await getPost(slug)

  return (
    <>
      <PostScreen post={post} />
      <JsonLdScript post={post} />
    </>
  )
}
