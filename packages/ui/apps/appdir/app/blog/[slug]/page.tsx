/** @jsxImportSource react */

import type { Metadata } from 'next'
import { PostScreen } from 'app/features/post/screen'
import { Post } from 'app/types'
import { isEmpty } from 'ramda'
import { blogIndex } from 'app/api/algolia'
import { combinedTitle } from 'app/constants/content'
import { imageUrlMedium } from 'app/utils/entry'
import { Config } from 'app/config'
import JsonLdScript from 'app/seo/jsonLd'

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const id = params.slug

  // fetch data
  const post = await getPost(id)

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
  const res = await blogIndex.search('', {
    filters: `objectID:${slug}`,
    cacheable: true,
  })

  if (isEmpty(res.hits)) {
    return {} as Post
  }

  return res.hits[0] as unknown as Post
}

export default async function BlogPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)

  return (
    <>
      <PostScreen post={post} />
      <JsonLdScript post={post} />
    </>
  )
}
