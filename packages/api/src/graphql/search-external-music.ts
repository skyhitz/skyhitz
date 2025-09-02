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
      const trackInfoQuery = {
        query:
          'query PlayerTrackInfo($trackId: UUID!){ track(id:$trackId){ id audio{ audio128k{ id url } audioHls{ id url } audioOriginal{ id url } } } }',
      }
      const releaseTracksWithAudioUuid = {
        query:
          'query ReleaseTracksWithAudio($id: UUID!){ release(id:$id){ id tracksPaginated(pagination:{ first: 1 }){ edges{ node{ id audio{ audioHls{ url } audio128k{ url } audioOriginal{ url } } } } } } }',
      }
      const releaseTracksWithAudioId = {
        query:
          'query ReleaseTracksWithAudio($id: ID!){ release(id:$id){ id tracksPaginated(pagination:{ first: 1 }){ edges{ node{ id audio{ audioHls{ url } audio128k{ url } audioOriginal{ url } } } } } } }',
      }
      const releaseMetaUuid = {
        query:
          'query ReleaseMeta($id: UUID!){ release(id:$id){ id titleSlug artist{ soundHandle } } }',
      }
      const releaseMetaId = {
        query:
          'query ReleaseMeta($id: ID!){ release(id:$id){ id titleSlug artist{ soundHandle } } }',
      }
      const mintedReleaseQuery = {
        query:
          'query ReleasePage($soundHandle:String!,$releaseSlug:String!){ mintedRelease(soundHandle:$soundHandle, releaseSlug:$releaseSlug){ id track{ id } } }',
      }
      const releaseDirectTrackUuid = {
        query: 'query ReleaseTrack($id: UUID!){ release(id:$id){ id track{ id } } }',
      }
      const releaseDirectTrackId = {
        query: 'query ReleaseTrack($id: ID!){ release(id:$id){ id track{ id } } }',
      }
      // removed duplicate webapp/minted definitions
      const releaseTracksPaginatedId = {
        query:
          'query ReleaseTracks($id: ID!){ release(id:$id){ id tracksPaginated(pagination:{ first: 1 }){ edges{ node{ id } } } } }',
      }
      const releaseTracksPaginatedUuid = {
        query:
          'query ReleaseTracks($id: UUID!){ release(id:$id){ id tracksPaginated(pagination:{ first: 1 }){ edges{ node{ id } } } } }',
      }
      const releaseTracksFlatId = {
        query: 'query ReleaseTracks($id: ID!){ release(id:$id){ id tracks{ id } } }',
      }
      const releaseTracksFlatUuid = {
        query: 'query ReleaseTracks($id: UUID!){ release(id:$id){ id tracks{ id } } }',
      }
      // reused releaseMeta* and mintedReleaseQuery above
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        origin: 'https://www.sound.xyz',
        referer: 'https://www.sound.xyz/',
      }
      if (authToken) headers['auth-token'] = authToken
      if (clientKey) headers['x-sound-client-key'] = clientKey
      if (webappVersion) headers['x-sound-webapp-version'] = webappVersion

      async function fetchGraphQL(q: { query: string; variables: Record<string, unknown> }) {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(q),
          signal,
        })
        if (!r.ok) return null
        return (await r.json()) as any
      }

      // 1) Try treating rawId as a trackId directly
      console.log('Sound.xyz audio: try direct track', { id: rawId })
      const tryTrack = await fetchGraphQL({
        query: trackInfoQuery.query,
        variables: { trackId: rawId },
      })
      const directTrack = tryTrack?.data?.track
      if (directTrack?.audio) {
        const audioHls = directTrack.audio?.audioHls?.url as string | undefined
        const audio128k = directTrack.audio?.audio128k?.url as string | undefined
        const original = directTrack.audio?.audioOriginal?.url as string | undefined
        console.log('Sound.xyz audio: direct track success', { hasHls: !!audioHls, has128k: !!audio128k, hasOriginal: !!original })
        return audioHls ?? audio128k ?? original ?? null
      }

      // 2) Otherwise, treat rawId as releaseId → get first track via multiple schema variants
      // 2a) Try single-call variant that already includes audio
      const relAudioCandidates = [
        { q: releaseTracksWithAudioUuid, t: 'UUID/tracksPaginated+audio' },
        { q: releaseTracksWithAudioId, t: 'ID/tracksPaginated+audio' },
      ] as const
      for (const c of relAudioCandidates) {
        console.log('Sound.xyz audio: try release audio variant', { id: rawId, variant: c.t })
        const rel = await fetchGraphQL({ query: c.q.query, variables: { id: rawId } })
        const node = rel?.data?.release?.tracksPaginated?.edges?.[0]?.node
        const audioHls = node?.audio?.audioHls?.url as string | undefined
        const audio128k = node?.audio?.audio128k?.url as string | undefined
        const original = node?.audio?.audioOriginal?.url as string | undefined
        if (audioHls || audio128k || original) {
          console.log('Sound.xyz audio: release variant success', { variant: c.t, hasHls: !!audioHls, has128k: !!audio128k, hasOriginal: !!original })
          return audioHls ?? audio128k ?? original ?? null
        }
      }

      const candidates = [
        { q: releaseTracksPaginatedId, t: 'ID/tracksPaginated' },
        { q: releaseTracksPaginatedUuid, t: 'UUID/tracksPaginated' },
        { q: releaseTracksFlatId, t: 'ID/tracks' },
        { q: releaseTracksFlatUuid, t: 'UUID/tracks' },
        { q: releaseDirectTrackUuid, t: 'UUID/release.track' },
        { q: releaseDirectTrackId, t: 'ID/release.track' },
      ] as const
      let firstTrackId: string | undefined
      for (const c of candidates) {
        console.log('Sound.xyz audio: try release -> track id', { id: rawId, variant: c.t })
        const rel = await fetchGraphQL({ query: c.q.query, variables: { id: rawId } })
        const edges = rel?.data?.release?.tracksPaginated?.edges
        const flat = rel?.data?.release?.tracks
        firstTrackId = edges?.[0]?.node?.id || flat?.[0]?.id
        if (firstTrackId) {
          console.log('Sound.xyz audio: found first track id', { variant: c.t, trackId: firstTrackId })
          break
        }
      }
      if (!firstTrackId) {
        // Try deriving handle/slug and resolve mintedRelease -> track.id
        console.log('Sound.xyz audio: try release meta for mintedRelease', { id: rawId })
        for (const metaVariant of [
          { q: releaseMetaUuid, t: 'UUID/release.meta' },
          { q: releaseMetaId, t: 'ID/release.meta' },
        ] as const) {
          const meta = await fetchGraphQL({ query: metaVariant.q.query, variables: { id: rawId } })
          const handle = meta?.data?.release?.artist?.soundHandle as string | undefined
          const slug = meta?.data?.release?.titleSlug as string | undefined
          console.log('Sound.xyz audio: release meta', { variant: metaVariant.t, hasHandle: !!handle, hasSlug: !!slug })
          if (handle && slug) {
            const mr = await fetchGraphQL({ query: mintedReleaseQuery.query, variables: { soundHandle: handle, releaseSlug: slug } })
            const tid = mr?.data?.mintedRelease?.track?.id as string | undefined
            console.log('Sound.xyz audio: mintedRelease track id', { hasTrackId: !!tid })
            if (tid) {
              console.log('Sound.xyz audio: fetch track info (from mintedRelease)', { trackId: tid })
              const tr = await fetchGraphQL({ query: trackInfoQuery.query, variables: { trackId: tid } })
              const t = tr?.data?.track
              const h = t?.audio?.audioHls?.url as string | undefined
              const k = t?.audio?.audio128k?.url as string | undefined
              const o = t?.audio?.audioOriginal?.url as string | undefined
              console.log('Sound.xyz audio: mintedRelease track audio', { hasHls: !!h, has128k: !!k, hasOriginal: !!o })
              return h ?? k ?? o ?? null
            }
          }
        }
        return null
      }

      console.log('Sound.xyz audio: fetch track info', { trackId: firstTrackId })
      const trackRes = await fetchGraphQL({ query: trackInfoQuery.query, variables: { trackId: firstTrackId } })
      const track = trackRes?.data?.track
      if (!track?.audio) return null
      const audioHls = track.audio?.audioHls?.url as string | undefined
      const audio128k = track.audio?.audio128k?.url as string | undefined
      const original = track.audio?.audioOriginal?.url as string | undefined
      console.log('Sound.xyz audio: track info success', { hasHls: !!audioHls, has128k: !!audio128k, hasOriginal: !!original })
      return audioHls ?? audio128k ?? original ?? null


      // Unreachable because of returns above, but kept for clarity
      // Fallback via webappUri + mintedRelease
      // (We will not reach here; kept as reference)

    }

    return null
  } catch (_) {
    return null
  } finally {
    ac.abort()
  }
}


