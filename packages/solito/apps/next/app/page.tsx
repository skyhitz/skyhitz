import { HomeScreen } from 'app/features/home/screen'
import { fetchHomePagePosts } from 'app/api/algolia'
import { homeContent } from 'app/constants/content'
import JsonLdScript from 'app/seo/jsonLd'

// Enable ISR caching - revalidate every 5 minutes
export const revalidate = 300

export default async function HomePage() {
  const posts = await fetchHomePagePosts()

  return (
    <>
      <HomeScreen {...homeContent} posts={posts} landing={true} />
      <JsonLdScript landing />
    </>
  )
}
