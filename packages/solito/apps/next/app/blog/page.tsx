import { BlogScreen } from 'app/features/blog/screen'
import JsonLdScript from 'app/seo/jsonLd'
import type { Metadata } from 'next'
import { Config } from 'app/config'
import { fetchBlogPosts } from 'app/api/algolia'

export const metadata: Metadata = {
  title: 'Blog | Skyhitz - Music NFT News & Updates',
  description:
    'Stay updated with the latest news, tutorials, and insights about music NFTs, blockchain technology, and the Skyhitz platform. Learn about Stellar, smart contracts, and music ownership.',
  keywords: [
    'music NFT blog',
    'blockchain music news',
    'Stellar blockchain',
    'music NFT tutorials',
    'crypto music',
    'NFT news',
  ],
  alternates: { canonical: `${Config.APP_URL}/blog` },
  openGraph: {
    title: 'Blog | Skyhitz - Music NFT News & Updates',
    description:
      'Stay updated with the latest news and insights about music NFTs and blockchain technology.',
    url: `${Config.APP_URL}/blog`,
    type: 'website',
    images: [
      {
        url: `${Config.APP_URL}/icon-128.png`,
        width: 128,
        height: 128,
        alt: 'Skyhitz Blog',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Blog | Skyhitz - Music NFT News & Updates',
    description:
      'Stay updated with the latest news and insights about music NFTs and blockchain technology.',
  },
  robots: { index: true, follow: true },
}

// Revalidate blog list every 30 minutes
export const revalidate = 1800

export default async function BlogPage() {
  let blog: any[] = []
  try {
    blog = await fetchBlogPosts(0, 20)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
  }

  return (
    <>
      <BlogScreen posts={blog} />
      <JsonLdScript blog={blog} />
    </>
  )
}
