import { AlgoliaClient } from 'src/algolia/algolia'
import StellarClient from 'src/stellar/operations'

// Minimal Lithic webhook to off-ramp on transaction events
export async function handleLithicWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json()
    const type: string | undefined = (body && (body.type || body.event_type)) || undefined
    if (type === 'transaction.created' || type === 'transaction.updated') {
      const tx: any = body?.data || body?.transaction || {}
      const cardToken: string | undefined = tx?.card_token || tx?.card
      const amount: number = Number(tx?.amount || 0)
      const currency: string = (tx?.currency || 'USD').toUpperCase()
      if (!cardToken || !amount) return new Response(null, { status: 200 })
      // Only process USD transactions for now; extend to FX later
      if (currency !== 'USD') return new Response(null, { status: 200 })
      // Map card to user
      const algolia = new AlgoliaClient(env)
      // Prefer new generic field; fallback to legacy
      let user = await algolia.getUserByCardId(cardToken)
      if (!user) {
        user = await algolia.getUserByStripeCardId(cardToken)
      }
      if (!user || !user.publicKey) return new Response(null, { status: 200 })
      // Convert fiat -> XLM and off-ramp: amount is in minor units
      const stellar = new StellarClient(env)
      const { price } = await stellar.getXlmInUsdDexPrice()
      const usd = amount / 100
      const px = Number(price)
      if (!px || px <= 0) return new Response(null, { status: 200 })
      const xlmAmount = usd / px
      const { default: Encryption } = await import('src/util/encryption')
      const enc = new Encryption(env)
      const userSeed = await enc.decrypt(user.seed)
      await stellar.userPay(env.ISSUER_ID, xlmAmount, userSeed)
    }
    return new Response(null, { status: 200 })
  } catch (e) {
    console.log('Lithic webhook error', e)
    return new Response(null, { status: 200 })
  }
}


