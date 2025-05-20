import { BlogScreen } from 'app/features/blog/screen'
import JsonLdScript from 'app/seo/jsonLd'
import { fetchBlogPosts } from 'app/api/algolia'

export default async function BlogPage() {
  const blog = await fetchBlogPosts()

  return (
    <>
      <BlogScreen posts={blog} />
      <JsonLdScript blog={blog} />
    </>
  )
}

export const metadata = {
  title: 'Skyhitz Blog',
  description: 'News and Updates from Skyhitz',
}
