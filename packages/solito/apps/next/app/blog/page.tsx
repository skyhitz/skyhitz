import { BlogScreen } from 'app/features/blog/screen'
import JsonLdScript from 'app/seo/jsonLd'
import type { Metadata } from 'next'
import { Config } from 'app/config'

// Enable ISR caching - blog content doesn't change frequently
export const revalidate = 600 // 10 minutes

export default async function BlogPage() {
  // SSR is safe now (Algolia uses fetch requester); still fine if it fails
  let blog: any[] = []
  try {
    const { fetchBlogPosts } = await import('app/api/algolia')
    blog = await fetchBlogPosts(0, 20)
  } catch {}
  return (
    <>
      <BlogScreen posts={blog} />
      <JsonLdScript blog={blog} />
    </>
  )
}

export const metadata: Metadata = {
  title: 'Skyhitz Blog',
  description: 'News and Updates from Skyhitz',
  alternates: { canonical: `${Config.APP_URL}/blog` },
  robots: { index: true, follow: true },
}
