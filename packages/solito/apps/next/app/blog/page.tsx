import { BlogScreen } from 'app/features/blog/screen'
import JsonLdScript from 'app/seo/jsonLd'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import type { Metadata } from 'next'
import { Config } from 'app/config'

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
