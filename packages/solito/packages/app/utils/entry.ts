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

/**
 * Transforms an IPFS URL to an HTTP URL for video content
 * @param videoUrl Original video URL
 * @param useFallback Whether to use the fallback gateway
 * @returns Transformed URL that can be used in video players
 */
export function videoSrc(videoUrl?: string, useFallback = false): string {
  if (!videoUrl) {
    return '';
  }
  
  if (isIpfs(videoUrl)) {
    const gateway = useFallback ? fallbackGateway : pinataGateway;
    return `${gateway}/${videoUrl.replace(ipfsProtocol, '')}`;
  }
  return videoUrl;
}

/**
 * Transforms an IPFS URL to an HTTP URL for image content
 * @param imageUrl Original image URL
 * @returns Transformed URL that can be used in image components
 */
export function imageSrc(imageUrl?: string): string {
  if (!imageUrl) {
    return 'https://skyhitz.io/icon.png';
  }
  
  if (isIpfs(imageUrl)) {
    return `${pinataGateway}/${imageUrl.replace(ipfsProtocol, '')}`;
  }
  return imageUrl;
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
