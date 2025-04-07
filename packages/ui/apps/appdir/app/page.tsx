/** @jsxImportSource react */

import { HomeScreen } from 'app/features/home/screen'
import { Post } from 'app/types'
import { isEmpty } from 'ramda'
import { blogIndex } from 'app/api/algolia'
import { homeContent } from 'app/constants/content'
import JsonLdScript from 'app/seo/jsonLd'

const fetchPosts = async () => {
  const res = await blogIndex.search<Post>('', { hitsPerPage: 3 })

  if (isEmpty(res.hits)) {
    return []
  }

  return res.hits as Post[]
}

export default async function HomePage() {
  const posts = await fetchPosts()

  return (
    <>
      <HomeScreen {...homeContent} posts={posts} landing={true} />
      <JsonLdScript landing />
    </>
  )
}
