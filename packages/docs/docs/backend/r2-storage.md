---
id: r2-storage
title: Cloudflare R2 Storage
---

We pin media and metadata to R2 with content-addressed keys:

- Media bytes at `<cid>/index` with correct `Content-Type`
- Metadata JSON at `<entryCid>/index` and used as Algolia id

Content type detection ensures MP3/HLS/MP4 stream correctly on mobile/web.

Removal flow deletes metadata and associated media hashes (image + audio/video) across their prefixes.


