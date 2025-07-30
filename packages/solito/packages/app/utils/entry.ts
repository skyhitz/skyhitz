/**
 * Utility functions for entry-related operations
 */
import { ipfsProtocol, pinataGateway, fallbackGateway } from '../constants/constants';

/**
 * Checks if a URL is an IPFS URL
 * @param url URL to check
 * @returns boolean indicating if the URL is an IPFS URL
 */
export function isIpfs(url?: string): boolean {
  return !!url?.startsWith(ipfsProtocol);
}

const r2BaseUrl = 'https://r2.skyhitz.io';
const useR2 = true; // Feature flag: set to false to fallback to Pinata

// Updated videoSrc to use R2 with HLS preference
export function videoSrc(videoUrl?: string, useFallback = false): string {
  if (!videoUrl) return '';

  if (useR2 && isIpfs(videoUrl)) {
    const hash = videoUrl.replace('ipfs://', '');
    if (useFallback) {
      return `${r2BaseUrl}/${hash}/mp4/index.mp4`;
    }
    return `${r2BaseUrl}/${hash}/hls/index.m3u8`;
  }

  // Existing Pinata logic as fallback
  const gateway = useFallback ? fallbackGateway : pinataGateway;
  return `${gateway}/${videoUrl.replace(ipfsProtocol, '')}`;
}

// New imageSrc for R2
export function imageSrc(imageUrl?: string, ext = 'png'): string {
  if (!imageUrl) return '';

  if (useR2 && isIpfs(imageUrl)) {
    const hash = imageUrl.replace('ipfs://', '');
    return `${r2BaseUrl}/${hash}/index.${ext}`;
  }

  // Existing Pinata logic
  return `${pinataGateway}/${imageUrl.replace(ipfsProtocol, '')}`;
}

// New metaSrc for R2
export function metaSrc(metaHash: string): string {
  if (useR2) {
    return `${r2BaseUrl}/${metaHash}/index.json`;
  }
  return `${pinataGateway}/${metaHash}`;
}

/**
 * Formats the image URL to return the small-sized version
 * @param imageUrl Original image URL
 * @returns URL for small-sized image
 */
export function imageUrlSmall(imageUrl?: string): string {
  if (!imageUrl) {
    return 'https://skyhitz.io/icon.png';
  }
  
  if (isIpfs(imageUrl)) {
    return `${pinataGateway}/${imageUrl.replace(ipfsProtocol, '')}`;
  }
  
  // For cloudinary images, transform to small size
  return imageUrl.split('/upload/').join('/upload/w_80/');
}

/**
 * Formats the image URL to return the medium-sized version
 * @param imageUrl Original image URL
 * @returns URL for medium-sized image
 */
export function imageUrlMedium(imageUrl?: string): string {
  if (!imageUrl) {
    return 'https://skyhitz.io/icon.png';
  }
  
  if (isIpfs(imageUrl)) {
    return `${pinataGateway}/${imageUrl.replace(ipfsProtocol, '')}`;
  }
  
  // For cloudinary images, transform to medium size
  return imageUrl.split('/upload/').join('/upload/w_500/');
}
