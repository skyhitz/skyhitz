type LithicRequestInit = RequestInit & { json?: any }

export default class LithicClient {
  private baseUrl: string
  private apiKey: string

  constructor(private env: Env) {
    this.baseUrl = env.LITHIC_BASE_URL || 'https://api.lithic.com'
    if (!env.LITHIC_API_KEY) throw new Error('LITHIC_API_KEY not configured')
    this.apiKey = env.LITHIC_API_KEY
  }

  private async request<T = any>(path: string, init: LithicRequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: any = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
    const body = init.json ? JSON.stringify(init.json) : init.body
    const res = await fetch(url, { ...init, headers, body })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Lithic ${init.method || 'GET'} ${path} failed: ${res.status} ${text}`)
    }
    return (await res.json()) as T
  }

  // Cardholder
  async createCardholder(input: {
    name: string
    email: string
    address: { line1: string; line2?: string | null; city: string; state?: string | null; postal_code: string; country: string }
  }): Promise<any> {
    // API path per public docs: /v1/cardholders
    return this.request('/v1/cardholders', {
      method: 'POST',
      json: {
        first_name: input.name,
        last_name: '.',
        email: input.email,
        address: {
          line1: input.address.line1,
          line2: input.address.line2 || undefined,
          city: input.address.city,
          state: input.address.state || undefined,
          postal_code: input.address.postal_code,
          country: input.address.country,
        },
        // Provide required defaults; adjust to your Lithic program as needed
        kyc_passed: true,
      },
    })
  }

  // Card
  async createCard(input: { cardholder_token: string; type?: 'VIRTUAL' | 'PHYSICAL' }): Promise<any> {
    return this.request('/v1/cards', {
      method: 'POST',
      json: {
        cardholder_token: input.cardholder_token,
        type: input.type || 'VIRTUAL',
      },
    })
  }

  async getCard(cardToken: string): Promise<any> {
    return this.request(`/v1/cards/${cardToken}`, { method: 'GET' })
  }

  // Reveal/embed token (one-time token to display sensitive details via Lithic UI component)
  async createRevealToken(cardToken: string): Promise<{ token: string }> {
    // Placeholder endpoint name; adjust to your Lithic program if different
    const res = await this.request(`/v1/cards/${cardToken}/embed`, { method: 'POST' })
    return (res as any) as { token: string }
  }

  // Event subscriptions (webhooks)
  async createEventSubscription(url: string, event_types?: string[] | null): Promise<any> {
    return this.request('/v1/event_subscriptions', {
      method: 'POST',
      json: {
        url,
        event_types: event_types ?? null,
      },
    })
  }
}


