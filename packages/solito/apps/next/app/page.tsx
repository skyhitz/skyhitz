import { HomeScreen } from 'app/features/home/screen'
import { fetchHomePagePosts } from 'app/api/algolia'
import { homeContent } from 'app/constants/content'
import JsonLdScript from 'app/seo/jsonLd'

// Revalidate home page every 30 minutes for fresh blog content
export const revalidate = 1800

export default async function HomePage() {
  const posts = await fetchHomePagePosts()

  return (
    <>
      <HomeScreen {...homeContent} posts={posts} landing={true} />
      <JsonLdScript landing />
    </>
  )
}
