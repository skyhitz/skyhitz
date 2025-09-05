import algoliasearch, { SearchIndex } from 'algoliasearch'
import { createFetchRequester } from '@algolia/requester-fetch'
import axios from 'axios'
// @ts-ignore
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import mime from 'mime-types'

const BASE_URL = process.env.R2_ENDPOINT || 'https://8d06a01e958a084add5fcf155430e0fa.r2.cloudflarestorage.com'
const BUCKET = process.env.R2_BUCKET || 'skyhitz'

const s3 = new S3Client({
  region: 'auto',
  endpoint: BASE_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

async function objectExists(key: string): Promise<boolean> {
  try {
    // @ts-ignore
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch (err: any) {
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) return false
    return false
  }
}

async function downloadWithRetry(url: string, retries = 3, delay = 1000): Promise<Buffer> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
      return Buffer.from(response.data)
    } catch (error) {
      if (attempt === retries) throw error
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }
  throw new Error('unreachable')
}

async function getAllBlogPosts(index: SearchIndex) {
  const hitsPerPage = 1000
  let page = 0
  let all: any[] = []
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await index.search('', { page, hitsPerPage, attributesToRetrieve: ['objectID', 'imageUrl'] })
    all = all.concat(res.hits as any[])
    if ((res.hits as any[]).length < hitsPerPage) break
    page += 1
  }
  return all
}

async function main() {
  const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || ''
  const ALGOLIA_ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY || ''
  const APP_URL = process.env.APP_URL || 'https://skyhitz.io'
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
    throw new Error('Set ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY env vars')
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, { requester: createFetchRequester() })
  const appDomain = APP_URL.replace('https://', '')
  const blogIndex = client.initIndex(`${appDomain}:blog`)

  const posts = await getAllBlogPosts(blogIndex)
  console.log(`Found ${posts.length} blog posts`)

  const GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs',
    'https://gateway.pinata.cloud/ipfs',
    'https://w3s.link/ipfs',
    'https://dweb.link/ipfs',
    'https://ipfs.io/ipfs',
  ] as const
  let migrated = 0
  let skipped = 0
  function extractIpfsHash(url?: string): string | undefined {
    if (!url) return undefined
    if (url.startsWith('ipfs://')) return url.replace('ipfs://', '')
    try {
      const u = new URL(url)
      // Handle R2 URL pattern: <BASE_URL>/<BUCKET>/<hash>/index
      const base = new URL(BASE_URL)
      if (u.hostname === base.hostname) {
        const parts = u.pathname.split('/').filter(Boolean)
        if (parts.length >= 2 && parts[0] === BUCKET) {
          const hash = parts[1]
          if (hash && hash !== 'index') return hash
        }
      }
      // match /ipfs/<hash>(/...)?
      const parts = u.pathname.split('/').filter(Boolean)
      const ipfsIdx = parts.findIndex((p) => p.toLowerCase() === 'ipfs')
      if (ipfsIdx >= 0 && parts[ipfsIdx + 1]) return parts[ipfsIdx + 1]
    } catch (_) {
      // not a valid URL, ignore
    }
    return undefined
  }

  for (const post of posts) {
    const objectID = (post as any).objectID as string
    const imageUrl = (post as any).imageUrl as string | undefined
    const hash = extractIpfsHash(imageUrl)
    // Skip if not IPFS
    if (!hash) {
      skipped++
      continue
    }
    const key = `${hash}/index`
    const exists = await objectExists(key)
    if (!exists) {
      let ext = 'png'
      let srcUrl: string | undefined
      // Try HEAD on multiple gateways to get content-type
      for (const gw of GATEWAYS) {
        try {
          const head = await axios.head(`${gw}/${hash}`, { timeout: 15000 })
          if (head.status >= 200 && head.status < 300) {
            ext = (mime.extension(head.headers['content-type']) as string) || 'png'
            srcUrl = `${gw}/${hash}`
            break
          }
        } catch (_) {}
      }
      // If HEADs failed, pick first gateway as src
      if (!srcUrl) srcUrl = `${GATEWAYS[0]}/${hash}`
      try {
        // Attempt GET across gateways until success
        let data: Buffer | undefined
        let lastErr: any
        for (const gw of GATEWAYS) {
          try {
            const buf = await downloadWithRetry(`${gw}/${hash}`)
            data = buf
            srcUrl = `${gw}/${hash}`
            break
          } catch (e) {
            lastErr = e
            continue
          }
        }
        if (!data) throw lastErr || new Error('All gateways failed')
        // Minimal content sniff for common types if ext is png
        if (ext === 'png' && data.length > 8) {
          const sig = data.subarray(0, 12)
          if (sig[0] === 0xFF && sig[1] === 0xD8 && sig[2] === 0xFF) ext = 'jpg'
          else if (sig.toString('ascii', 0, 4) === 'RIFF' && sig.toString('ascii', 8, 12) === 'WEBP') ext = 'webp'
          else if (sig.toString('ascii', 0, 3) === 'GIF') ext = 'gif'
        }
        // @ts-ignore
        await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: data, ContentType: (mime.lookup(ext) as string) || 'image/png' }))
        console.log(`Uploaded ${key} from ${srcUrl}`)
      } catch (e) {
        console.error(`Failed to migrate ${objectID} (${hash})`, e)
        continue
      }
    }

    const ipfsUrl = `ipfs://${hash}`
    try {
      if (imageUrl !== ipfsUrl) {
        const res: any = await blogIndex.partialUpdateObject(
          { objectID, imageUrl: ipfsUrl },
          // ensure record exists; if not, create it with just imageUrl
          { createIfNotExists: true } as any,
        )
        if (res?.taskID) {
          // @ts-ignore - v4 has waitTask
          await blogIndex.waitTask(res.taskID)
        }
        migrated++
        console.log(`Updated blog imageUrl for ${objectID} -> ${ipfsUrl}`)
      } else {
        console.log(`Image URL already ipfs:// for ${objectID}`)
      }
    } catch (e) {
      console.error(`Algolia update failed for ${objectID}`, e)
    }
  }

  console.log(`Migrated: ${migrated}, skipped (non-ipfs/no image): ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


