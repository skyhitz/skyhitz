# AI Search Optimization Guide for Skyhitz

This document outlines all AI search optimization implementations for Skyhitz to ensure maximum discoverability by AI assistants, search engines, and LLM-powered tools.

## Overview

Skyhitz has implemented comprehensive AI search optimization to help AI systems understand and index our music NFT marketplace effectively. This includes multiple standards and formats used by different AI platforms.

## Implemented Files & Standards

### 1. LLMs.txt (Primary AI Discovery File)
**Location**: `https://skyhitz.io/llms.txt`  
**Format**: Markdown-like text file  
**Purpose**: Primary information file for Large Language Models

This file provides:
- Platform overview and description
- Key features and technology stack
- Public page listings
- API resources
- Contact information
- Guidelines for AI crawlers

**Implementation**: Next.js route handler at `app/llms.txt/route.ts`

### 2. Robots.txt (Enhanced)
**Location**: `https://skyhitz.io/robots.txt`  
**Format**: Standard robots.txt  
**Purpose**: Crawling rules for all bots including AI

Features:
- Explicit rules for 20+ AI crawlers (GPTBot, ClaudeBot, Google-Extended, etc.)
- Crawl delays to prevent overload
- Disallow rules for private pages
- References to sitemap and documentation

**Implementation**: Next.js route handler at `app/robots.ts`

### 3. .well-known/ai.txt
**Location**: `https://skyhitz.io/.well-known/ai.txt`  
**Format**: Text file  
**Purpose**: Standard location for AI-specific information

Contains condensed platform information following emerging standards for AI discovery.

**Implementation**: Static file at `app/.well-known/ai.txt`

### 4. .well-known/llm-manifest.json
**Location**: `https://skyhitz.io/.well-known/llm-manifest.json`  
**Format**: JSON  
**Purpose**: Machine-readable manifest of LLM capabilities

Includes:
- Platform metadata
- Capabilities (search, browse)
- Content types (music, NFT, audio, video, blog)
- Blockchain information (Stellar, Soroban, HITZ token)
- Links to all resources
- Public page structure
- Contact information

**Implementation**: Static JSON at `app/.well-known/llm-manifest.json`

### 5. .well-known/ai-plugin.json
**Location**: `https://skyhitz.io/.well-known/ai-plugin.json`  
**Format**: JSON  
**Purpose**: ChatGPT plugin manifest

Follows OpenAI's plugin specification for potential ChatGPT integration.

**Implementation**: Static JSON at `app/.well-known/ai-plugin.json`

### 6. OpenAPI Specification
**Location**: `https://skyhitz.io/openapi.yaml`  
**Format**: OpenAPI 3.0 YAML  
**Purpose**: API structure documentation for AI systems

Comprehensive specification including:
- All public endpoints
- Detailed descriptions
- Path parameters and examples
- Response schemas
- Tagged organization
- Contact and external docs

**Implementation**: Static YAML at `app/openapi.yaml`

### 7. Enhanced JSON-LD Structured Data
**Format**: Schema.org JSON-LD  
**Purpose**: Rich semantic data for search engines and AI

Implemented schemas:
- **Organization**: Company information with full social links
- **WebSite**: Site-wide data with SearchAction
- **WebApplication**: Platform as an app with features
- **MusicRecording**: Individual tracks with artist info
- **Product**: NFTs as products with offers
- **BlogPosting**: Blog content with author and dates
- **ItemList**: Charts and blog listings
- **ProfilePage**: User profiles

**Implementation**: React component at `packages/app/seo/jsonLd.tsx`

### 8. Sitemap.xml
**Location**: `https://skyhitz.io/sitemap.xml`  
**Format**: XML Sitemap  
**Purpose**: Complete site structure for crawlers

Dynamic sitemap including:
- Static pages (home, search, chart, etc.)
- Dynamic blog posts with last modified dates
- Change frequencies and priorities
- Reference from robots.txt

**Implementation**: Next.js route handler at `app/sitemap.ts`

## Supported AI Crawlers

The following AI bots are explicitly welcomed and configured:

### OpenAI
- GPTBot
- ChatGPT-User

### Anthropic
- ClaudeBot
- Claude-Web
- anthropic-ai

### Google
- Google-Extended (Gemini/Bard)
- GoogleOther

### Apple
- Applebot-Extended (Apple Intelligence)

### Meta
- FacebookBot
- Meta-ExternalAgent
- Meta-ExternalCrawler

### xAI
- Grok
- GrokBot
- xai-crawler
- xAIBot

### Perplexity
- PerplexityBot

### Others
- CCBot (Common Crawl - used by many AI systems)
- Bytespider (ByteDance/TikTok)
- Omgilibot
- Diffbot
- cohere-ai

## AI-Friendly Features

### 1. Clear Content Structure
- Semantic HTML throughout
- Proper heading hierarchy
- ARIA labels where needed
- Clean URL structure

### 2. Rich Metadata
- Comprehensive Open Graph tags
- Twitter Card metadata
- Schema.org structured data on every page
- Language and charset declarations

### 3. Public API Documentation
- OpenAPI spec for structure understanding
- Clear endpoint descriptions
- Example URLs and parameters

### 4. Content Guidelines
- Public vs. private page distinction
- Authentication requirements clearly marked
- Rate limit considerations
- Contact information for issues

### 5. Cross-References
All AI discovery files reference each other:
- llms.txt → references all other resources
- robots.txt → references sitemap and docs
- llm-manifest.json → links to all endpoints
- OpenAPI → references external docs

## Best Practices Applied

### 1. Multiple Discovery Paths
AI systems can find Skyhitz through:
- Standard robots.txt crawling
- Direct llms.txt lookup
- .well-known directory discovery
- OpenAPI spec parsing
- Sitemap following
- JSON-LD extraction

### 2. Redundant Information
Critical information appears in multiple formats:
- Text (llms.txt, ai.txt)
- JSON (llm-manifest.json, ai-plugin.json)
- YAML (openapi.yaml)
- XML (sitemap.xml)
- HTML meta tags
- JSON-LD structured data

### 3. Human and Machine Readable
All files are:
- Human-readable with clear formatting
- Machine-parseable with standard formats
- Well-commented and documented
- Version controlled

### 4. Performance Optimized
- Appropriate cache headers
- Compressed responses
- CDN-friendly
- Crawl delay specifications

## Testing & Validation

### Validation Checklist

- [ ] llms.txt accessible at root
- [ ] robots.txt with proper AI bot rules
- [ ] .well-known/ai.txt accessible
- [ ] .well-known/llm-manifest.json valid JSON
- [ ] .well-known/ai-plugin.json valid JSON
- [ ] openapi.yaml valid OpenAPI 3.0
- [ ] sitemap.xml valid XML
- [ ] JSON-LD validates on schema.org
- [ ] All cross-references work
- [ ] Cache headers appropriate

### Testing URLs

1. Main AI discovery: https://skyhitz.io/llms.txt
2. Robots: https://skyhitz.io/robots.txt
3. AI info: https://skyhitz.io/.well-known/ai.txt
4. LLM manifest: https://skyhitz.io/.well-known/llm-manifest.json
5. AI plugin: https://skyhitz.io/.well-known/ai-plugin.json
6. OpenAPI: https://skyhitz.io/openapi.yaml
7. Sitemap: https://skyhitz.io/sitemap.xml

### Validation Tools

- OpenAPI Validator: https://editor.swagger.io/
- Schema.org Validator: https://validator.schema.org/
- Robots.txt Tester: Google Search Console
- Sitemap Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- JSON Validator: https://jsonlint.com/

## Maintenance

### Regular Updates Needed

1. **llms.txt**: Update when major features change
2. **robots.txt**: Add new AI bots as they emerge
3. **OpenAPI spec**: Update when adding/changing public pages
4. **sitemap.ts**: Automatically updates (dynamic)
5. **JSON-LD**: Review when content types change

### Version Control

All AI optimization files are in git and should be reviewed in PRs when:
- Adding new public pages
- Changing platform features
- Updating company information
- Modifying content structure

## Impact & Benefits

### For AI Discovery
- Maximum visibility to AI assistants
- Clear understanding of platform capabilities
- Proper context for AI responses about Skyhitz
- Reduced hallucinations about platform features

### For SEO
- Rich snippets in search results
- Better search engine understanding
- Improved ranking for music NFT queries
- Enhanced knowledge graph presence

### For Users
- More accurate AI assistant information
- Better search result previews
- Easier platform discovery
- Clear value proposition

## Future Enhancements

### Potential Additions
1. AI-powered search endpoint documentation
2. GraphQL schema for AI consumption
3. RSS feeds for blog content
4. Podcast/audio feed specifications
5. API rate limit specifications
6. Webhook documentation for future integrations

### Monitoring
- Track AI bot traffic in analytics
- Monitor which endpoints AI systems access most
- Watch for new AI crawlers to add
- A/B test different llms.txt formats

## Resources

### Standards & Specifications
- llms.txt: https://llmstxt.org/
- OpenAPI: https://www.openapis.org/
- Schema.org: https://schema.org/
- Robots.txt: https://www.robotstxt.org/
- Sitemaps: https://www.sitemaps.org/

### Related Documentation
- Main docs: https://docs.skyhitz.io
- Stellar blockchain: https://stellar.org
- Soroban contracts: https://soroban.stellar.org

## Contact

For AI-related issues or enhancements:
- Technical: support@skyhitz.io
- Developer docs: https://docs.skyhitz.io
- GitHub: https://github.com/skyhitz

---

Last Updated: October 16, 2025
Version: 1.0.0

