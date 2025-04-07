/** @jsxImportSource react */

import { BlogScreen } from 'app/features/blog/screen'
import { Post } from 'app/types'
import { isEmpty } from 'ramda'
import { blogIndex } from 'app/api/algolia'
import JsonLdScript from 'app/seo/jsonLd'

const getBlog = async () => {
  const res = await blogIndex.search<Post>('', { cacheable: true })

  if (isEmpty(res.hits)) {
    return []
  }

  return res.hits as Post[]
}

export default async function BlogPage() {
  const blog = await getBlog()

  return (
    <>
      <BlogScreen posts={blog} />
      <JsonLdScript blog={blog} />
    </>
  )
}
