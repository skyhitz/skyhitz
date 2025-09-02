import { GraphQLError } from 'graphql'
import { Context } from '../util/types'

type ExternalTrack = {
  id: string
  title: string
  artist?: string
  genre?: string
  source: 'audius' | 'soundxyz'
  url?: string
  imageUrl?: string
}

const EDM_KEYWORDS = [
  'edm',
  'electronic',
  'house',
  'techno',
  'trance',
  'dubstep',
  'drum and bass',
  'dnb',
  'electro',
  'progressive house',
  'deep house',
  'tech house',
  'hardstyle',
  'hard dance',
  'breakbeat',
  'garage',
  'bass',
]

function containsEdmGenre(text?: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return EDM_KEYWORDS.some((k) => lower.includes(k))
}

function matchesQuery(text: string | undefined, query: string): boolean {
  if (!text) return false
  return text.toLowerCase().includes(query.toLowerCase())
}

async function fetchAudius(query: string, limit = 20, signal?: AbortSignal): Promise<ExternalTrack[]> {
  try {
    // Discover an Audius host
    const hostsRes = await fetch('https://api.audius.co', { signal })
    const hosts = (await hostsRes.json()) as { data: string[] }
    const host = hosts?.data?.[0]
    if (!host) return []

    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=skyhitz`
    const res = await fetch(url, { signal })
    const json = (await res.json()) as any
    const tracks = (json?.data || []) as any[]

    return tracks
      .slice(0, limit)
      .map((t) => {
        const title = t.title || ''
        const artist = t.user?.name || t.user?.handle
        const genre = t.genre || t.mood
        const imageUrl = t.artwork?.['150x150'] || t.artwork?.['480x480'] || t.artwork?.['1000x1000']
        const permalink = t.permalink || t.perma_link
        return {
          id: `audius:${t.track_id ?? t.id ?? title}`,
          title,
          artist,
          genre,
          source: 'audius',
          url: permalink,
          imageUrl,
        } as ExternalTrack
      })
      .filter(
        (t) =>
          containsEdmGenre(t.genre) ||
          containsEdmGenre(`${t.title} ${t.artist}`) ||
          matchesQuery(t.title, query) ||
          matchesQuery(t.artist, query),
      )
  } catch (_) {
    return []
  }
}

async function fetchSoundXyz(query: string, limit = 20, env: Env, signal?: AbortSignal): Promise<ExternalTrack[]> {
  // Use logged-in client credentials if available
  const authToken = (env as any).SOUND_API_KEY as string | undefined // reused var name, holds the Fe26 token
  const clientKey = (env as any).SOUND_CLIENT_KEY as string | undefined
  const webappVersion = (env as any).SOUND_WEBAPP_VERSION as string | undefined
  if (!authToken && !clientKey) return []
  try {
    const endpoint = 'https://api.sound.xyz/graphql'
    const body = {
      query:
        'query ReleasesSearch($input: SearchInput!){ search(input:$input){ releasesPaginated{ edges{ node{ id title webappUri coverImage{ url } staticCoverImage{ url } artist{ name } } } } } }',
      variables: { input: { text: query, limit } },
    }

    async function doRequest(headers: Record<string, string>, body: Record<string, unknown>) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      })
      return res
    }

    // Build primary header set (mimic web client)
    const baseHeaders: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'https://www.sound.xyz',
      referer: 'https://www.sound.xyz/',
    }
    if (authToken) baseHeaders['auth-token'] = authToken
    if (clientKey) baseHeaders['x-sound-client-key'] = clientKey
    if (webappVersion) baseHeaders['x-sound-webapp-version'] = webappVersion

    const attempts: Record<string, string>[] = [
      baseHeaders,
      // Fallbacks
      clientKey ? { ...baseHeaders, 'auth-token': undefined as unknown as string, 'x-sound-client-key': clientKey } : baseHeaders,
      authToken ? { 'content-type': 'application/json', authorization: `Bearer ${authToken}` } : baseHeaders,
    ]

    let lastError: any
    for (let i = 0; i < attempts.length; i++) {
      // Remove undefined headers
      const hdrs = Object.fromEntries(
        Object.entries(attempts[i]).filter(([, v]) => typeof v === 'string' && v.length > 0),
      ) as Record<string, string>

      try {
        // Attempt new schema first, fall back to legacy
        let json: any = null
        const res = await doRequest(hdrs, body)
        if (!res.ok) {
          console.log('Sound.xyz request failed', { status: res.status, try: i + 1, usedHeaders: Object.keys(hdrs), shape: 'releasesPaginated' })
        } else {
          const maybe = (await res.json()) as any
          if (maybe?.errors) {
            console.log('Sound.xyz GraphQL errors', { try: i + 1, shape: 'releasesPaginated', errors: maybe.errors?.map((e: any) => e?.message) })
          } else {
            json = maybe
          }
        }
        if (!json) {
          lastError = new Error('All body variants failed')
          continue
        }
        const search = json?.data?.search || {}
        const edges: any[] = (search?.releasesPaginated?.edges as any[]) || []
        const tracks: ExternalTrack[] = edges.map((e) => {
          const n = e.node || e
          const title = n.title || n.name
          const artist = n.artist?.name || n.artists?.[0]?.name
          const imageUrl = n.coverImage?.url || n.staticCoverImage?.url || n.image?.url || n.image
          const permalink = n.webappUri || n.url
          if (!title) return undefined as unknown as ExternalTrack
          return {
            id: `soundxyz:${n.id ?? title}`,
            title,
            artist,
            genre: undefined,
            source: 'soundxyz',
            url: permalink,
            imageUrl,
          }
        }).filter(Boolean) as ExternalTrack[]
        if (tracks.length === 0) {
          console.log('Sound.xyz ok - no matches', { query })
        }
        return tracks
      } catch (e) {
        lastError = e
        console.log('Sound.xyz fetch error', { try: i + 1 })
      }
    }

    if (lastError) {
      console.log('Sound.xyz all attempts failed')
    }
    return []
  } catch (_) {
    return []
  }
}

// OpenSea integration has been removed

export const searchExternalMusicResolver = async (
  _root: unknown,
  args: { query: string; limit?: number; offset?: number },
  { env }: Context,
) => {
  const { query, limit = 20 } = args
  if (!query || !query.trim()) {
    throw new GraphQLError('Query is required')
  }

  const ac = new AbortController()
  const { signal } = ac

  try {
    const [audius, sound] = await Promise.all([
      fetchAudius(query, limit, signal),
      fetchSoundXyz(query, limit, env, signal),
    ])

    const combined: ExternalTrack[] = [...audius, ...sound]
    // De-dupe by id/title/url
    const seen = new Set<string>()
    const unique = combined.filter((t) => {
      const key = `${t.source}|${t.id}|${t.url ?? ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return unique
  } catch (e) {
    console.log('searchExternalMusicResolver error', e)
    throw new GraphQLError('Failed to search external music')
  } finally {
    ac.abort()
  }
}

export const externalAudioUrlResolver = async (
  _root: unknown,
  args: { id: string },
  { env }: Context,
) => {
  const { id } = args
  if (!id) throw new GraphQLError('id is required')

  // id is prefixed like 'audius:...' or 'soundxyz:...'
  const [source, rawId] = id.split(':', 2)
  if (!source || !rawId) throw new GraphQLError('invalid id')

  const ac = new AbortController()
  const { signal } = ac
  try {
    if (source === 'audius') {
      // Resolve an Audius host and construct the stream endpoint
      const hostsRes = await fetch('https://api.audius.co', { signal })
      const hosts = (await hostsRes.json()) as { data: string[] }
      const host = hosts?.data?.[0]
      if (!host) return null
      return `${host}/v1/tracks/${encodeURIComponent(rawId)}/stream?app_name=skyhitz`
    }

    if (source === 'soundxyz') {
      // Query release playback for signed audio URL using site headers
      const authToken = (env as any).SOUND_API_KEY as string | undefined
      const clientKey = (env as any).SOUND_CLIENT_KEY as string | undefined
      const webappVersion = (env as any).SOUND_WEBAPP_VERSION as string | undefined
      if (!authToken && !clientKey) return null

      const endpoint = 'https://api.sound.xyz/graphql'
      const body = {
        query:
          'query ReleasePlayback($id: ID!){ release(id:$id){ id title tracks{ id title audio{ url mimeType } } } }',
        variables: { id: rawId },
      }
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        origin: 'https://www.sound.xyz',
        referer: 'https://www.sound.xyz/',
      }
      if (authToken) headers['auth-token'] = authToken
      if (clientKey) headers['x-sound-client-key'] = clientKey
      if (webappVersion) headers['x-sound-webapp-version'] = webappVersion

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      })
      if (!res.ok) return null
      const json = (await res.json()) as any
      const tracks = json?.data?.release?.tracks || []
      const audioUrl = tracks?.[0]?.audio?.url as string | undefined
      return audioUrl ?? null
    }

    return null
  } catch (_) {
    return null
  } finally {
    ac.abort()
  }
}


