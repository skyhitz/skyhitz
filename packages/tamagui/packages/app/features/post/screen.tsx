'use client'
import { H1, H2, H3, P, A, Text } from 'app/design/typography'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import Footer from 'app/ui/footer'
import { Navbar } from 'app/ui/navbar/Navbar'
import { formattedDate } from 'app/utils'
import { ScrollView } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { SolitoImage } from 'app/design/solito-image'
import * as React from 'react'
import { imageSrc } from 'app/utils/entry'

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
        <P key={`text-${globalKeyCounter++}`} marginBottom="$4" color="$color">
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
          <P key={`p-${globalKeyCounter++}`} marginBottom="$4" color="$color">
            {formatInlineNodes(inner)}
          </P>
        )
        return
      }

      if (tag === 'h1') {
        result.push(
          <H1 key={`h1-${globalKeyCounter++}`} marginBottom="$4" marginTop="$6" color="$color">
            {formatInlineNodes(inner)}
          </H1>
        )
        return
      }

      if (tag === 'h2') {
        result.push(
          <H2 key={`h2-${globalKeyCounter++}`} marginBottom="$3" marginTop="$5" color="$color">
            {formatInlineNodes(inner)}
          </H2>
        )
        return
      }

      if (tag === 'h3') {
        result.push(
          <H3 key={`h3-${globalKeyCounter++}`} marginBottom="$2" marginTop="$4" color="$color">
            {formatInlineNodes(inner)}
          </H3>
        )
        return
      }

      if (tag === 'ul') {
        const items = extractContent(inner, 'li')
        const listItems = items.map((item, itemIndex) => (
          <XStack key={`ul-li-${globalKeyCounter++}-${itemIndex}`} flexDirection="row" marginBottom="$2">
            <P color="$color" marginRight="$2">•</P>
            <P flex={1} color="$color">{formatInlineNodes(item)}</P>
          </XStack>
        ))
        result.push(
          <YStack key={`ul-${globalKeyCounter++}`} marginBottom="$4" marginLeft="$4">
            {listItems}
          </YStack>
        )
        return
      }

      if (tag === 'ol') {
        const items = extractContent(inner, 'li')
        const listItems = items.map((item, itemIndex) => (
          <XStack key={`ol-li-${globalKeyCounter++}-${itemIndex}`} flexDirection="row" marginBottom="$2">
            <P color="$color" marginRight="$2">{itemIndex + 1}.</P>
            <P flex={1} color="$color">{formatInlineNodes(item)}</P>
          </XStack>
        ))
        result.push(
          <YStack key={`ol-${globalKeyCounter++}`} marginBottom="$4" marginLeft="$4">
            {listItems}
          </YStack>
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
    <YStack
      height="100%"
      width="100%"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      backgroundColor="$background"
    >
      <Navbar />
      <ScrollView style={{ marginHorizontal: 'auto', width: '100%', maxWidth: 896, paddingHorizontal: 24 }}>
        <YStack lg={{ marginTop: '$12' }} gap="$8">
          <H1 marginBottom="$4" marginTop="$10" fontSize={{ xs: '$9', lg: '$11' }} color="$color">
            {title}
          </H1>
          <P marginTop="$4" textAlign="left" color="$color11">
            {formattedDate(publishedAtTimestamp)}
          </P>
          <YStack
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            marginVertical="$8"
          />

          <YStack aspectRatio={3/2} width="100%" marginBottom="$8">
            <YStack position="relative" height="100%" width="100%" overflow="hidden" borderRadius="$4">
              <SolitoImage
                src={imageSrc(imageUrl)}
                alt={title || 'Blog post image'}
                fill
                contentFit="cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </YStack>
          </YStack>

          {parseHtmlContent(content)}
          <Footer marginTop="$16" />
        </YStack>
      </ScrollView>
    </YStack>
  )
}
