import { PostScreen } from 'app/features/post/screen'
import { combinedTitle } from 'app/constants/content'
import { imageUrlMedium } from 'app/utils/entry'
import { Config } from 'app/config'
import JsonLdScript from 'app/seo/jsonLd'
import { fetchPost } from 'app/api/algolia'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

// Revalidate blog posts every hour
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post || !post.title) {
    return {
      title: 'Post Not Found | Skyhitz Blog',
      robots: { index: false, follow: true },
    }
  }

  // Clean HTML from content and get first sentence for description
  const cleanContent = post.content.replace(/<\/?[^>]+(>|$)/g, '')
  const description = cleanContent.split('. ', 1)[0] + '.'
  const url = `${Config.APP_URL}/blog/${post.slug}`
  const imageUrl = imageUrlMedium(post.imageUrl)

  return {
    title: `${post.title} | Skyhitz Blog`,
    description: description.slice(0, 160),
    keywords: [post.tag, 'music NFT', 'blockchain', 'Skyhitz', 'Stellar'].filter(Boolean),
    authors: [{ name: 'Alejo Mendoza' }],
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description.slice(0, 160),
      images: [
        {
          url: imageUrl,
          alt: post.title,
        },
      ],
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: description.slice(0, 160),
      url: url,
      siteName: 'Skyhitz',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: post.title,
        },
      ],
      publishedTime: post.publishedAtTimestamp
        ? new Date(post.publishedAtTimestamp * 1000).toISOString()
        : undefined,
      authors: ['Alejo Mendoza'],
      tags: [post.tag, 'music NFT', 'blockchain'].filter(Boolean),
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await fetchPost(slug)

  // Show 404 if post not found
  if (!post || !post.title) {
    return notFound()
  }

  return (
    <>
      <PostScreen post={post} />
      <JsonLdScript post={post} />
    </>
  )
}
