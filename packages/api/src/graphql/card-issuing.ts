import { GraphQLError } from 'graphql'
import { requireAuth } from 'src/auth/auth-context'
import { Context } from 'src/util/types'
import LithicClient from 'src/lithic/client'
import StellarClient from 'src/stellar/operations'
import { AlgoliaClient } from 'src/algolia/algolia'
import { createHmac } from 'crypto'

// Shared return type shape from schema
type CardInfo = {
  id: string
  brand?: string | null
  last4?: string | null
  expMonth?: number | null
  expYear?: number | null
  status?: string | null
}

export const myCardResolver = async (_: any, __: any, ctx: Context): Promise<CardInfo | null> => {
  const user = requireAuth(ctx)
  const env = ctx.env
  const algolia = new AlgoliaClient(env)
  const fullUser = await algolia.getUser(user.id)
  const cardId = ((fullUser as any)?.cardId || (fullUser as any)?.stripeCardId) as string | undefined
  if (!cardId) return null

  try {
      const lithic = new LithicClient(env)
      const card = await lithic.getCard(cardId)
      return {
        id: card.token || card.id,
        brand: (card.brand || card.network || 'VIRTUAL') as any,
        last4: card.last4,
        expMonth: card.exp_month || undefined,
        expYear: card.exp_year || undefined,
        status: card.state || card.status,
      }
    
  } catch (e) {
    console.log('myCard: retrieve failed', e)
    return null
  }
}

const MIN_XLM_TO_ISSUE = 6

type IssueCardInput = {
  name: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state?: string | null
  postalCode: string
  country: string
}

export const issueCardResolver = async (_: any, { input }: { input: IssueCardInput }, ctx: Context): Promise<CardInfo> => {
  const user = requireAuth(ctx)
  const env = ctx.env
  const stellar = new StellarClient(env)
  const algolia = new AlgoliaClient(env)

  // Balance check
  const { availableCredits } = await stellar.accountCredits(user.publicKey)
  if (availableCredits < MIN_XLM_TO_ISSUE) {
    throw new GraphQLError('INSUFFICIENT_FUNDS')
  }

  // Fetch persisted user to see if cardholder/card already exists
  const fullUser = await algolia.getUser(user.id)
  let cardholderId: string | undefined = (fullUser as any)?.cardholderId || (fullUser as any)?.stripeCardholderId
  let cardId: string | undefined = (fullUser as any)?.cardId || (fullUser as any)?.stripeCardId

  try {
    const lithic = new LithicClient(env)
    if (!cardholderId) {
      const ch = await lithic.createCardholder({
        name: input.name,
        email: fullUser.email,
        address: {
          line1: input.addressLine1,
          line2: input.addressLine2 || undefined,
          city: input.city,
          state: input.state || undefined,
          postal_code: input.postalCode,
          country: input.country,
        },
      })
      cardholderId = ch.token || ch.id
      await algolia.partialUpdateUser({ objectID: fullUser.objectID, cardholderId })
    }
    if (!cardId) {
      const card = await lithic.createCard({ cardholder_token: cardholderId!, type: 'VIRTUAL' })
      cardId = card.token || card.id
      await algolia.partialUpdateUser({ objectID: fullUser.objectID, cardId })
    }

    const card = await lithic.getCard(cardId!)
    return {
      id: card.token || card.id,
      brand: (card.brand || card.network || 'VIRTUAL') as any,
      last4: card.last4,
      expMonth: card.exp_month || undefined,
      expYear: card.exp_year || undefined,
      status: card.state || card.status,
    }
  } catch (e: any) {
    console.log('issueCard failed', e)
    throw new GraphQLError('ISSUING_FAILED')
  }
}

// Issue a short-lived client secret for Issuing Elements to reveal card details
export const cardRevealTokenResolver = async (_: any, __: any, ctx: Context): Promise<string> => {
  const user = requireAuth(ctx)
  const env = ctx.env
  const algolia = new AlgoliaClient(env)
  const fullUser = await algolia.getUser(user.id)
  const cardId = ((fullUser as any)?.cardId || (fullUser as any)?.stripeCardId) as string | undefined
  if (!cardId) throw new GraphQLError('NO_CARD')
  if (env.LITHIC_API_KEY) {
    const lithic = new LithicClient(env)
    const tok = await lithic.createRevealToken(cardId)
    return tok.token
  }
  throw new GraphQLError('REVEAL_UNAVAILABLE')
}

export const cardRevealEmbedResolver = async (_: any, __: any, ctx: Context): Promise<{ url: string; embedRequest: string; hmac: string }> => {
  const user = requireAuth(ctx)
  const env = ctx.env
  const algolia = new AlgoliaClient(env)
  const fullUser = await algolia.getUser(user.id)
  const cardId = ((fullUser as any)?.cardId || (fullUser as any)?.stripeCardId) as string | undefined
  if (!cardId) throw new GraphQLError('NO_CARD')

  const baseUrl = env.LITHIC_BASE_URL || 'https://api.lithic.com'
  const payload = {
    token: cardId,
    expiration: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  }
  const json = JSON.stringify(payload)
  const embedRequest = btoa(json)
  // Compute HMAC (SHA-256) using API key
  const key = env.LITHIC_API_KEY
  if (!key) throw new GraphQLError('MISSING_LITHIC_API_KEY')
  // Node-like crypto not available in CF Workers; use subtle crypto
  const algo = { name: 'HMAC', hash: 'SHA-256' } as HmacImportParams
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), algo, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(json))
  const hmac = btoa(String.fromCharCode(...new Uint8Array(signature)))
  const url = `${baseUrl}/v1/embed/card?embed_request=${encodeURIComponent(embedRequest)}&hmac=${encodeURIComponent(hmac)}`
  return { url, embedRequest, hmac }
}


