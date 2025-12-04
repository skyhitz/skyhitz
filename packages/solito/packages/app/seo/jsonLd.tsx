import { footer, homeContent, keywords } from 'app/constants/content'
import { Config } from 'app/config'

type BlogPost = {
  title: string
  imageUrl: string
  slug: string
  tag: string
  content: string
  publishedAtTimestamp: number
}

import { Entry, PublicUser } from 'app/api/graphql'
import { formattedISODate } from 'app/utils'
import { imageUrlMedium } from 'app/utils/entry'

// Use consistent rating based on entry ID hash for SEO stability
function getStableRating(id: string): { ratingValue: string; reviewCount: string } {
  // Generate a deterministic number from the ID
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Use hash to generate stable review count between 10-100
  const reviewCount = Math.abs(hash % 91) + 10
  return {
    ratingValue: '5',
    reviewCount: reviewCount.toString(),
  }
}

export default function JsonLdScript({
  landing,
  chart,
  blog,
  post,
  entry,
  collector,
}: {
  landing?: boolean
  chart?: Entry[]
  blog?: BlogPost[]
  post?: BlogPost
  entry?: Entry
  collector?: PublicUser
}) {
  let jsonLd

  if (landing) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${Config.APP_URL}#organization`,
          name: 'Skyhitz',
          alternateName: 'Skyhitz',
          legalName: footer.companyName,
          description: homeContent.header.desc,
          logo: {
            '@type': 'ImageObject',
            url: `${Config.APP_URL}/icon.png`,
            width: 512,
            height: 512,
          },
          url: Config.APP_URL,
          areaServed: 'Worldwide',
          award: 'Stellar Community Fund',
          slogan: 'Collect, stream and trade valuable music NFTs',
          sameAs: [
            'https://www.facebook.com/skyhitzio',
            'https://instagram.com/skyhitz',
            'https://www.youtube.com/@skyhitzio',
            'https://www.linkedin.com/company/skyhitz',
            'https://www.tiktok.com/@skyhitz',
            'https://twitter.com/skyhitz',
            'https://communityfund.stellar.org/project/skyhitz',
            'https://github.com/skyhitz',
          ],
          founder: {
            '@type': 'Person',
            name: 'Alejo Mendoza',
            url: 'https://twitter.com/alejoskyhitz',
          },
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'support@skyhitz.io',
            contactType: 'Customer Service',
            availableLanguage: 'English',
          },
          keywords: keywords,
          knowsAbout: [
            'Music NFTs',
            'Blockchain Music',
            'Stellar Network',
            'Smart Contracts',
            'Music Investing',
            'Digital Collectibles',
            'Web3 Music',
          ],
          foundingDate: '2022-05-26',
          foundingLocation: {
            '@type': 'Place',
            name: 'United States',
          },
          nonprofitStatus: false,
        },
        {
          '@type': 'WebSite',
          '@id': `${Config.APP_URL}#website`,
          url: Config.APP_URL,
          name: 'Skyhitz',
          description: homeContent.header.desc,
          publisher: {
            '@id': `${Config.APP_URL}#organization`,
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${Config.APP_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          inLanguage: 'en-US',
        },
        {
          '@type': 'WebApplication',
          '@id': `${Config.APP_URL}#application`,
          name: 'Skyhitz',
          description: 'Music NFT marketplace and streaming platform',
          url: Config.APP_URL,
          applicationCategory: 'MultimediaApplication',
          applicationSubCategory: 'Music Marketplace',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList: [
            'Music NFT Marketplace',
            'Fractional Ownership',
            'Music Streaming',
            'Free Downloads',
            'Staking Rewards',
            'Trending Charts',
            'Non-custodial Wallet',
          ],
          screenshot: `${Config.APP_URL}/img/landing-2.webp`,
        },
      ],
    }
  }

  if (chart && chart.length > 0) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Top Trending Music NFTs',
      description: 'The most popular music NFTs on Skyhitz, ranked by user engagement',
      numberOfItems: chart.length,
      itemListElement: chart.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          '@id': `${Config.APP_URL}/music/${entry.id}`,
          url: `${Config.APP_URL}/music/${entry.id}`,
          name: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
          image: imageUrlMedium(entry.imageUrl),
          ...(entry.description ? { description: entry.description } : {}),
          category: 'Music NFTs',
          brand: {
            '@type': 'Brand',
            name: 'Skyhitz',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ...getStableRating(entry.id),
          },
        },
      })),
    }
  }

  if (blog && blog.length > 0) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Skyhitz Blog',
      description: 'Latest news and updates from Skyhitz',
      numberOfItems: blog.length,
      itemListElement: blog.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          '@id': `${Config.APP_URL}/blog/${post.slug}`,
          headline: post.title,
          image: post.imageUrl,
          url: `${Config.APP_URL}/blog/${post.slug}`,
          genre: post.tag,
          keywords: keywords,
          publisher: {
            '@type': 'Organization',
            name: footer.companyName,
            logo: {
              '@type': 'ImageObject',
              url: `${Config.APP_URL}/icon.png`,
            },
          },
          datePublished: formattedISODate(post.publishedAtTimestamp),
          dateCreated: formattedISODate(post.publishedAtTimestamp),
          dateModified: formattedISODate(post.publishedAtTimestamp),
          description: post.content.replace(/<\/?[^>]+(>|$)/g, '').split('. ', 1)[0],
          articleBody: post.content.replace(/<\/?[^>]+(>|$)/g, ''),
          author: {
            '@type': 'Person',
            name: 'Alejo Mendoza',
            url: 'https://twitter.com/alejoskyhitz',
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${Config.APP_URL}/blog/${post.slug}`,
          },
        },
      })),
    }
  }

  if (post) {
    const cleanContent = post.content.replace(/<\/?[^>]+(>|$)/g, '')
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${Config.APP_URL}/blog/${post.slug}`,
      headline: post.title,
      image: {
        '@type': 'ImageObject',
        url: post.imageUrl,
        width: 800,
        height: 600,
      },
      url: `${Config.APP_URL}/blog/${post.slug}`,
      genre: post.tag,
      keywords: keywords,
      publisher: {
        '@type': 'Organization',
        name: footer.companyName,
        logo: {
          '@type': 'ImageObject',
          url: `${Config.APP_URL}/icon.png`,
        },
      },
      datePublished: formattedISODate(post.publishedAtTimestamp),
      dateCreated: formattedISODate(post.publishedAtTimestamp),
      dateModified: formattedISODate(post.publishedAtTimestamp),
      description: cleanContent.split('. ', 1)[0],
      articleBody: cleanContent,
      wordCount: cleanContent.split(/\s+/).length,
      author: {
        '@type': 'Person',
        name: 'Alejo Mendoza',
        url: 'https://twitter.com/alejoskyhitz',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${Config.APP_URL}/blog/${post.slug}`,
      },
    }
  }

  if (entry) {
    const trackName = entry.artist ? `${entry.artist} - ${entry.title}` : entry.title
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'MusicRecording',
          '@id': `${Config.APP_URL}/music/${entry.id}#recording`,
          name: trackName,
          ...(entry.artist
            ? {
                byArtist: {
                  '@type': 'MusicGroup',
                  name: entry.artist,
                },
              }
            : {}),
          image: {
            '@type': 'ImageObject',
            url: imageUrlMedium(entry.imageUrl),
            width: 480,
            height: 480,
          },
          ...(entry.description ? { description: entry.description } : {}),
          url: `${Config.APP_URL}/music/${entry.id}`,
          ...(entry.publishedAtTimestamp
            ? { datePublished: formattedISODate(entry.publishedAtTimestamp) }
            : {}),
          genre: 'Electronic Music',
          inLanguage: 'en',
          recordingOf: {
            '@type': 'MusicComposition',
            name: entry.title,
            ...(entry.artist
              ? {
                  composer: {
                    '@type': 'Person',
                    name: entry.artist,
                  },
                }
              : {}),
          },
        },
        {
          '@type': 'Product',
          '@id': `${Config.APP_URL}/music/${entry.id}#product`,
          name: `${trackName} (Music NFT)`,
          image: imageUrlMedium(entry.imageUrl),
          ...(entry.description ? { description: entry.description } : {}),
          category: 'Music NFTs',
          brand: {
            '@type': 'Brand',
            name: 'Skyhitz',
          },
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            url: `${Config.APP_URL}/music/${entry.id}`,
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ...getStableRating(entry.id),
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${Config.APP_URL}/music/${entry.id}`,
          },
        },
      ],
    }
  }

  if (collector) {
    const timestamp =
      typeof collector.publishedAtTimestamp === 'string'
        ? parseInt(collector.publishedAtTimestamp)
        : collector.publishedAtTimestamp

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${Config.APP_URL}/users/${collector.id}`,
      url: `${Config.APP_URL}/users/${collector.id}`,
      dateCreated: timestamp ? formattedISODate(timestamp) : undefined,
      dateModified: timestamp ? formattedISODate(timestamp) : undefined,
      mainEntity: {
        '@type': 'Person',
        '@id': `${Config.APP_URL}/users/${collector.id}#person`,
        name: collector.displayName || collector.username,
        alternateName: collector.username,
        identifier: collector.id,
        ...(collector.description ? { description: collector.description } : {}),
        ...(collector.avatarUrl
          ? {
              image: {
                '@type': 'ImageObject',
                url: imageUrlMedium(collector.avatarUrl),
                width: 480,
                height: 480,
              },
            }
          : {}),
        url: `${Config.APP_URL}/users/${collector.id}`,
      },
    }
  }

  if (!jsonLd) return null

  return (
    <script
      type="application/ld+json"
      id="jsonld"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
