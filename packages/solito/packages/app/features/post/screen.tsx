'use client'
import { H1, H2, H3, P, A } from 'app/design/typography'
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

  // Strip remaining tags but keep inner text; keep simple strong handling
  const stripTags = (text: string): string => {
    let stripped = text.replace(/<strong>(.*?)<\/strong>/g, '$1')
    stripped = stripped.replace(/<em>(.*?)<\/em>/g, '$1')
    return stripped.replace(/<\/?[^>]+(>|$)/g, '')
  }

  // Global key generator for stable keys within a render
  let globalKeyCounter = 0

  // Convert inline HTML (with <a> tags) into React nodes using <A>
  const formatInlineNodes = (fragment: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = []
    const anchorRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let lastIndex = 0
    let m: RegExpExecArray | null

    const pushText = (textPart: string) => {
      const cleaned = decodeEntities(stripTags(textPart))
      if (cleaned) nodes.push(cleaned)
    }

    while ((m = anchorRegex.exec(fragment)) !== null) {
      const before = fragment.slice(lastIndex, m.index)
      if (before) {
        const decoded = decodeEntities(stripTags(before))
        if (decoded) {
          const contentWithoutTrailing = decoded.replace(/[ \t\u00A0]+$/, '')
          const hadTrailingWhitespace = /[ \t\u00A0]+$/.test(decoded)
          if (contentWithoutTrailing) nodes.push(contentWithoutTrailing)
          if (hadTrailingWhitespace) nodes.push(' ')
        }
      }

      const href = m[1] || ''
      const label = decodeEntities(stripTags(m[2] || '')) || href
      nodes.push(
        <A key={`a-${globalKeyCounter++}`} href={href} target="_blank">
          {label}
        </A>
      )

      lastIndex = anchorRegex.lastIndex
    }

    const trailing = fragment.slice(lastIndex)
    pushText(trailing)

    return nodes
  }

  // Parse HTML in a single pass preserving original order
  const parseBlocks = (source: string = html): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    const blockRegex = /<(h[1-3]|p|ul|ol|div|section)\b[^>]*>([\s\S]*?)<\/\1>/gi
    let match: RegExpExecArray | null
    let lastIndex = 0

    const pushTextIfAny = (text: string) => {
      const cleaned = text.trim()
      if (!cleaned) return
      result.push(
        <P key={`text-${globalKeyCounter++}`} className="mb-4 text-[--text-color]">
          {formatInlineNodes(cleaned)}
        </P>
      )
    }

    const renderBlock = (tag: string, inner: string) => {
      if (tag === 'div' || tag === 'section') {
        // Recursively parse inner to preserve nested order
        const children = parseBlocks(inner)
        if (children.length > 0) {
          // Do not wrap to avoid extra spacing differences; inline the children
          children.forEach((child) => result.push(child))
        }
        return
      }

      if (tag === 'p') {
        result.push(
          <P key={`p-${globalKeyCounter++}`} className="mb-4 text-[--text-color]">
            {formatInlineNodes(inner)}
          </P>
        )
        return
      }

      if (tag === 'h1') {
        result.push(
          <H1 key={`h1-${globalKeyCounter++}`} className="mb-4 mt-6 text-[--text-color]">
            {formatInlineNodes(inner)}
          </H1>
        )
        return
      }

      if (tag === 'h2') {
        result.push(
          <H2 key={`h2-${globalKeyCounter++}`} className="mb-3 mt-5 text-[--text-color]">
            {formatInlineNodes(inner)}
          </H2>
        )
        return
      }

      if (tag === 'h3') {
        result.push(
          <H3 key={`h3-${globalKeyCounter++}`} className="mb-2 mt-4 text-[--text-color]">
            {formatInlineNodes(inner)}
          </H3>
        )
        return
      }

      if (tag === 'ul') {
        const items = extractContent(inner, 'li')
        const listItems = items.map((item, itemIndex) => (
          <View key={`ul-li-${globalKeyCounter++}-${itemIndex}`} className="flex-row mb-2">
            <Text className="text-[--text-color] mr-2">•</Text>
            <P className="flex-1 text-[--text-color]">{formatInlineNodes(item)}</P>
          </View>
        ))
        result.push(
          <View key={`ul-${globalKeyCounter++}`} className="mb-4 ml-4">
            {listItems}
          </View>
        )
        return
      }

      if (tag === 'ol') {
        const items = extractContent(inner, 'li')
        const listItems = items.map((item, itemIndex) => (
          <View key={`ol-li-${globalKeyCounter++}-${itemIndex}`} className="flex-row mb-2">
            <Text className="text-[--text-color] mr-2">{itemIndex + 1}.</Text>
            <P className="flex-1 text-[--text-color]">{formatInlineNodes(item)}</P>
          </View>
        ))
        result.push(
          <View key={`ol-${globalKeyCounter++}`} className="mb-4 ml-4">
            {listItems}
          </View>
        )
        return
      }
    }

    while ((match = blockRegex.exec(source)) !== null) {
      const before = source.slice(lastIndex, match.index)
      pushTextIfAny(before)

      const tag = match[1]
      const inner = match[2]
      if (typeof tag === 'string') {
        renderBlock(tag, inner ?? '')
      }

      lastIndex = blockRegex.lastIndex
    }

    // Trailing text after the last block
    const trailing = source.slice(lastIndex)
    pushTextIfAny(trailing)

    return result
  }

  // Clean and format text content — replaced by formatInlineNodes above

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

        <View className="aspect-[3/2] w-full object-cover mb-8">
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
