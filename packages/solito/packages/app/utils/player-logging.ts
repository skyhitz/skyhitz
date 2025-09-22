export function logPlayerError(
  eventLike: any,
  internalPlayer: any,
  playbackUri?: string
) {
  try {
    const isMediaEl =
      internalPlayer &&
      (internalPlayer.tagName === 'VIDEO' || internalPlayer.tagName === 'AUDIO')
    const mediaErr = isMediaEl ? internalPlayer.error : null
    const errCodeMap: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED',
      2: 'MEDIA_ERR_NETWORK',
      3: 'MEDIA_ERR_DECODE',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
    }

    const first = eventLike
    const evt = first && typeof first === 'object' && 'type' in first ? (first as any) : null
    const hlsDetails =
      first && typeof first === 'object' && ('details' in first || 'fatal' in first || 'type' in first)
        ? {
            type: (first as any).type,
            details: (first as any).details,
            fatal: (first as any).fatal,
          }
        : null

    const info: any = {
      message: (first && ((first as any).message || (first as any).reason)) || undefined,
      eventType: evt?.type,
      playbackUri,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      media: isMediaEl
        ? {
            tag: internalPlayer.tagName,
            src: internalPlayer.getAttribute('src'),
            currentSrc: internalPlayer.currentSrc,
            networkState: internalPlayer.networkState,
            readyState: internalPlayer.readyState,
            error:
              mediaErr
                ? {
                    code: mediaErr.code,
                    name: errCodeMap[mediaErr.code] || 'UNKNOWN',
                    message: mediaErr.message,
                  }
                : null,
          }
        : null,
      hls: hlsDetails,
    }

    if (playbackUri && typeof fetch !== 'undefined') {
      fetch(playbackUri, { method: 'HEAD', mode: 'cors' })
        .then((res) => {
          console.error('ReactPlayer onError (HEAD)', {
            url: playbackUri,
            ok: res.ok,
            status: res.status,
            contentType: res.headers.get('content-type'),
            acao: res.headers.get('access-control-allow-origin'),
          })
        })
        .catch((err) => {
          console.error('ReactPlayer onError (HEAD failed)', {
            url: playbackUri,
            error: (err && ((err as any).message || String(err))) || 'unknown',
          })
        })
    }

    console.error('ReactPlayer onError', info)
  } catch (err) {
    console.error('ReactPlayer onError (logger failed)', err)
  }
}


