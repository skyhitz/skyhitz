import {
  ipfsProtocol,
  fallbackGateway,
  pinataGateway,
} from 'app/constants/constants'

export function isIpfs(url: string) {
  return !!url?.startsWith(ipfsProtocol)
}

export function videoSrc(videoUrl: string, useFallback = false) {
  if (isIpfs(videoUrl)) {
    const gateway = useFallback ? fallbackGateway : pinataGateway
    return `${gateway}/${videoUrl.replace(ipfsProtocol, '')}`
  }
  return videoUrl
}

export function imageSrc(imageUrl: string) {
  if (isIpfs(imageUrl))
    return `${pinataGateway}/${imageUrl.replace(ipfsProtocol, '')}`
  return imageUrl
}

export function imageUrlSmall(imageUrl: string) {
  if (isIpfs(imageUrl))
    return `${pinataGateway}/${imageUrl?.replace(ipfsProtocol, '')}`
  return imageUrl?.split('/upload/').join('/upload/w_80/')
}

export function imageUrlMedium(imageUrl: string) {
  if (isIpfs(imageUrl))
    return `${pinataGateway}/${imageUrl?.replace(ipfsProtocol, '')}`
  return imageUrl?.split('/upload/').join('/upload/w_500/')
}
