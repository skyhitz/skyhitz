import { BlogScreen } from 'app/features/blog/screen'
import JsonLdScript from 'app/seo/jsonLd'
import { fetchBlogPosts } from 'app/api/algolia'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import type { Metadata } from 'next'
import { Config } from 'app/config'

export default async function BlogPage() {
  const blog = await fetchBlogPosts()

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
