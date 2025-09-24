import { GraphQLError } from 'graphql'
import { requireAuth } from 'src/auth/auth-context'
import { Context } from 'src/util/types'
import StripeClient from 'src/stripe/client'
import StellarClient from 'src/stellar/operations'
import { AlgoliaClient } from 'src/algolia/algolia'

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
  const { stripe } = new StripeClient(env)
  const algolia = new AlgoliaClient(env)
  const fullUser = await algolia.getUser(user.id)

  const cardId = (fullUser as any)?.stripeCardId as string | undefined
  if (!cardId) return null

  try {
    const card = await stripe.issuing.cards.retrieve(cardId)
    return {
      id: card.id,
      brand: (card as any)?.brand || null,
      last4: (card as any)?.last4 || null,
      expMonth: (card as any)?.exp_month || null,
      expYear: (card as any)?.exp_year || null,
      status: card.status,
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
  const { stripe } = new StripeClient(env)
  const stellar = new StellarClient(env)
  const algolia = new AlgoliaClient(env)

  // Balance check
  const { availableCredits } = await stellar.accountCredits(user.publicKey)
  if (availableCredits < MIN_XLM_TO_ISSUE) {
    throw new GraphQLError('INSUFFICIENT_FUNDS')
  }

  // Fetch persisted user to see if cardholder/card already exists
  const fullUser = await algolia.getUser(user.id)
  let cardholderId: string | undefined = (fullUser as any)?.stripeCardholderId
  let cardId: string | undefined = (fullUser as any)?.stripeCardId

  try {
    if (!cardholderId) {
      // Create a minimal cardholder (test-mode friendly fields)
      const ch = await stripe.issuing.cardholders.create({
        name: input.name,
        email: fullUser.email,
        status: 'active',
        type: 'individual',
        billing: {
          address: {
            line1: input.addressLine1,
            line2: input.addressLine2 || undefined,
            city: input.city,
            state: input.state || undefined,
            postal_code: input.postalCode,
            country: input.country,
          },
        },
      })
      cardholderId = ch.id
      await algolia.partialUpdateUser({ objectID: fullUser.objectID, stripeCardholderId: ch.id })
    }

    if (!cardId) {
      const card = await stripe.issuing.cards.create({
        cardholder: cardholderId!,
        currency: 'usd',
        type: 'virtual',
      })
      cardId = card.id
      await algolia.partialUpdateUser({ objectID: fullUser.objectID, stripeCardId: card.id })
    }

    // Return fresh card info
    const card = await stripe.issuing.cards.retrieve(cardId)
    return {
      id: card.id,
      brand: (card as any)?.brand || null,
      last4: (card as any)?.last4 || null,
      expMonth: (card as any)?.exp_month || null,
      expYear: (card as any)?.exp_year || null,
      status: card.status,
    }
  } catch (e: any) {
    console.log('issueCard failed', e)
    throw new GraphQLError('ISSUING_FAILED')
  }
}

// Issue a short-lived client secret for Issuing Elements to reveal card details
export const issuingElementsClientSecretResolver = async (_: any, __: any, ctx: Context): Promise<string> => {
  const user = requireAuth(ctx)
  const env = ctx.env
  const { stripe } = new StripeClient(env)
  const algolia = new AlgoliaClient(env)
  const fullUser = await algolia.getUser(user.id)
  const cardId = (fullUser as any)?.stripeCardId as string | undefined
  if (!cardId) throw new GraphQLError('NO_CARD')
  // Create ephemeral key scoped to Issuing with card access
  const ek: any = await (stripe as any).ephemeralKeys.create(
    { issuing_card: cardId },
    { apiVersion: '2020-08-27' as any }
  )
  return ek.secret || ek.client_secret
}


