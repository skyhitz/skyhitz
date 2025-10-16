import { NextResponse } from 'next/server'
import { Config } from 'app/config'

export async function GET() {
  const baseUrl = Config.APP_URL
  
  const content = `# Skyhitz - Music NFT Marketplace

> Skyhitz is a next-generation decentralized music platform powered by Stellar smart contracts. We offer music fans, collectors, and creators a groundbreaking way to discover, stream, and invest in unique tracks.

## Overview

Collect, stream and trade valuable music NFTs with the best smart music contracts platform! Users can access exclusive music while empowering creators with transparent monetization on the Stellar blockchain.

## Key Features

- **Music NFT Marketplace**: Discover and collect expertly curated music NFTs
- **Fractional Ownership**: Purchase fractions of tracks at affordable prices
- **Free Downloads**: Download music videos (mp4) for offline enjoyment
- **Interactive Charts**: Trending tracks influenced by user interactions (buying, streaming, liking)
- **Easy Wallet Setup**: Create a Stellar wallet with just your email
- **Stream & Own**: Enjoy music whether you collect NFTs or just listen

## Technology Stack

- **Blockchain**: Stellar Network (fast transactions, low fees, decentralized)
- **Smart Contracts**: Soroban smart contracts on Stellar
- **Token**: HITZ token for platform rewards and staking
- **Network**: Mainnet deployment with production-ready contracts

## Public Pages

### Main Navigation
- Homepage: ${baseUrl}/
- Search Music: ${baseUrl}/search
- Top Chart: ${baseUrl}/chart
- Blog: ${baseUrl}/blog

### Content Pages
- Music Detail: ${baseUrl}/music/{id}
- User Profile: ${baseUrl}/users/{userId}
- Entry Page: ${baseUrl}/entry/{id}

### Legal
- Terms of Service: ${baseUrl}/terms
- Privacy Policy: ${baseUrl}/privacy

## Resources for AI

- **Sitemap**: ${baseUrl}/sitemap.xml
- **OpenAPI Spec**: ${baseUrl}/openapi.yaml
- **Robots.txt**: ${baseUrl}/robots.txt
- **AI Plugin Manifest**: ${baseUrl}/.well-known/ai-plugin.json
- **LLM Manifest**: ${baseUrl}/.well-known/llm-manifest.json
- **AI Info**: ${baseUrl}/.well-known/ai.txt
- **Developer Docs**: https://docs.skyhitz.io

## How It Works

1. **Discover**: Browse curated music NFT collections
2. **Collect**: Purchase full tracks or fractional shares
3. **Stream**: Listen to tracks with high-quality audio
4. **Earn**: Stake in tracks and earn rewards from the treasury
5. **Trade**: Buy and sell music NFTs on the platform

## For Music Creators

Artists interested in releasing on Skyhitz can contact: ar@skyhitz.io

## Platform Features

### Wallet & Payments
- Non-custodial Stellar wallets created with email
- XLM and USDC support
- Credit card on-ramp via Stripe
- Secure passwordless authentication

### Music NFTs (MFTs)
- Single mint per track for quality and liquidity
- Fractional ownership with shares
- On-chain metadata and ownership
- Transparent royalty distribution

### Treasury & Staking
- Users stake in tracks to earn APR
- Treasury managed by smart contracts
- Automated yield distribution
- Real-time APR calculations

### Discovery
- AI-powered search integration
- External music source aggregation (Audius)
- Algolia-powered instant search
- Interactive trending charts

## Contact & Social

- **Email**: support@skyhitz.io
- **Twitter/X**: @skyhitz
- **Instagram**: @skyhitz
- **Discord**: https://discord.com/invite/2C3HzsPEuZ

## Blockchain Identifiers

- **Stellar Network**: Mainnet
- **Contract**: Production Soroban contracts
- **Token Symbol**: HITZ

## Data Access

Public read-only access to:
- Music tracks and metadata
- Chart rankings
- Blog posts
- User profiles (public information only)

Authentication required for:
- Purchasing music NFTs
- Staking/unstaking
- Wallet operations
- Profile editing

## AI Bot Guidelines

All AI crawlers are welcome with the same access as regular users:
- GPTBot (OpenAI)
- ClaudeBot (Anthropic) 
- Google-Extended (Google)
- Applebot-Extended (Apple)
- PerplexityBot (Perplexity)
- Meta-ExternalCrawler (Meta)
- Grok/GrokBot/xai-crawler (xAI)

Please respect rate limits and follow robots.txt directives.

## Updates

This document is maintained at: ${baseUrl}/llms.txt
Last updated: ${new Date().toISOString().split('T')[0]}

---

Built with ❤️ for music lovers and creators
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

