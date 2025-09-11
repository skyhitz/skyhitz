---
id: player
title: Unified Player
---

Web player uses ReactPlayer with conditional HLS:

- Force HLS for `.m3u8` except on WebKit (native HLS)
- Force audio for direct MP3/HTTP(S) URLs
- `playsInline`, `crossOrigin` for mobile and CORS
- Fallback chain for R2: HLS → MP4 → raw object (`<hash>/index`)


