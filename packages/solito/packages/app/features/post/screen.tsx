'use client'
import { H1, H2, H3, P } from 'app/design/typography'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import Footer from 'app/ui/footer'
import { Navbar } from 'app/ui/navbar/Navbar'
import { formattedDate } from 'app/utils'
import { View, ScrollView, Text } from 'react-native'
import { SolitoImage } from 'app/design/solito-image'
import * as React from 'react'

// Parse HTML into formatted blocks with design system components
function parseHtmlContent(html: string): React.ReactNode[] {
  // Helper to decode HTML entities
  const decodeEntities = (text: string): string => {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')
      .replace(/&bull;/g, '•')
      .replace(/&lsquo;|&rsquo;/g, "'")
      .replace(/&ldquo;|&rdquo;/g, '"')
      .trim()
  }

  // Helper to extract content between tags
  const extractContent = (text: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'g')
    const matches: string[] = []
    let match
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1])
    }
    
    return matches
  }

  // Parse block-level elements
  const parseBlocks = () => {
    const result: React.ReactNode[] = []
    
    // Parse divs and sections - avoiding 's' flag for compatibility
    const divMatches: string[] = html.match(/<div[^>]*>([\s\S]*?)<\/div>/g) || []
    divMatches.forEach((divContent, index) => {
      // Process content within divs
      const innerContent = divContent.replace(/<div[^>]*>|<\/div>/g, '')
      const paragraphs = extractContent(innerContent, 'p')
      
      if (paragraphs.length > 0) {
        paragraphs.forEach((para, pIndex) => {
          result.push(
            <P key={`div-p-${index}-${pIndex}`} className="mb-4 text-[--text-color]">
              {formatTextContent(para)}
            </P>
          )
        })
      } else if (innerContent.trim()) {
        // Handle divs without p tags but with content
        result.push(
          <P key={`div-${index}`} className="mb-4 text-[--text-color]">
            {formatTextContent(innerContent)}
          </P>
        )
      }
    })
    
    // Parse headings (h1, h2, h3)
    for (let level = 1; level <= 3; level++) {
      const headings = extractContent(html, `h${level}`)
      headings.forEach((heading, index) => {
        if (level === 1) {
          result.push(
            <H1 key={`h1-${index}`} className="mb-4 mt-6 text-[--text-color]">
              {formatTextContent(heading)}
            </H1>
          )
        } else if (level === 2) {
          result.push(
            <H2 key={`h2-${index}`} className="mb-3 mt-5 text-[--text-color]">
              {formatTextContent(heading)}
            </H2>
          )
        } else {
          result.push(
            <H3 key={`h3-${index}`} className="mb-2 mt-4 text-[--text-color]">
              {formatTextContent(heading)}
            </H3>
          )
        }
      })
    }
    
    // Parse standalone paragraphs
    const paragraphs = extractContent(html, 'p')
    paragraphs.forEach((para, index) => {
      // Skip paragraphs that are already processed within divs
      if (!divMatches.some(div => div.includes(`<p>${para}</p>`) || div.includes(`<p>${para.trim()}</p>`))) {
        result.push(
          <P key={`p-${index}`} className="mb-4 text-[--text-color]">
            {formatTextContent(para)}
          </P>
        )
      }
    })
    
    // Parse lists - using multiline-compatible pattern
    const ulLists: string[] = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/g) || []
    ulLists.forEach((list, listIndex) => {
      const items = extractContent(list, 'li')
      const listItems = items.map((item, itemIndex) => (
        <View key={`ul-${listIndex}-li-${itemIndex}`} className="flex-row mb-2">
          <Text className="text-[--text-color] mr-2">•</Text>
          <P className="flex-1 text-[--text-color]">{formatTextContent(item)}</P>
        </View>
      ))
      
      result.push(
        <View key={`ul-${listIndex}`} className="mb-4 ml-4">
          {listItems}
        </View>
      )
    })
    
    const olLists: string[] = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/g) || []
    olLists.forEach((list, listIndex) => {
      const items = extractContent(list, 'li')
      const listItems = items.map((item, itemIndex) => (
        <View key={`ol-${listIndex}-li-${itemIndex}`} className="flex-row mb-2">
          <Text className="text-[--text-color] mr-2">{itemIndex + 1}.</Text>
          <P className="flex-1 text-[--text-color]">{formatTextContent(item)}</P>
        </View>
      ))
      
      result.push(
        <View key={`ol-${listIndex}`} className="mb-4 ml-4">
          {listItems}
        </View>
      )
    })
    
    return result
  }

  // Clean and format text content
  const formatTextContent = (text: string) => {
    // Handle strong/bold text
    let formatted = text.replace(/<strong>(.*?)<\/strong>/g, '*$1*')

    // Handle links - using a compatible regex pattern
    formatted = formatted.replace(
      /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g,
      '$2 [$1]'
    )

    // Remove remaining tags and decode
    return decodeEntities(formatted.replace(/<\/?[^>]+(>|$)/g, ''))
  }

  // Process all blocks and return the result
  return parseBlocks()
}

export function PostScreen({ post }: { post: any }) {
  const insets = useSafeArea()

  const { title, imageUrl, content, publishedAtTimestamp } = post

  return (
    <View
      className="flex h-full w-full"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: 'var(--bg-color)',
      }}
    >
      <Navbar />
      <ScrollView className="mx-auto w-full max-w-4xl px-6 lg:px-8 blog lg:mt-12 gap-8">
        <H1 className="mb-4 mt-10 text-4xl lg:text-6xl text-[--text-color]">
          {title}
        </H1>
        <P className="mt-4 text-left text-[--secondary-color]">
          {formattedDate(publishedAtTimestamp)}
        </P>
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: 'var(--border-color)',
            marginVertical: 32,
          }}
        />

        <View className="aspect-[3/2] w-full object-cover">
          <View className="relative h-full w-full overflow-hidden rounded-2xl">
            <SolitoImage
              src={imageUrl}
              alt={title || 'Blog post image'}
              fill
              contentFit="cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </View>
        </View>

        {parseHtmlContent(content)}
        <Footer className="mt-32" />
      </ScrollView>
    </View>
  )
}
