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
  // Pass through absolute URLs (external previews like Audius/Sound.xyz)
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }

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

// downloadSrc: Returns the direct MP4 URL for downloads (migrated video content)
export function downloadSrc(videoUrl?: string): string {
  if (!videoUrl) return '';
  // Pass through absolute URLs (external previews like Audius/Sound.xyz)
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }

  if (useR2 && isIpfs(videoUrl)) {
    const hash = videoUrl.replace('ipfs://', '');
    return `${r2BaseUrl}/${hash}/mp4/index.mp4`;
  }

  // Existing Pinata logic as fallback
  return `${pinataGateway}/${videoUrl.replace(ipfsProtocol, '')}`;
}

// originalSrc: Returns the original file URL (for audio files: MP3, WAV, AIFF)
export function originalSrc(videoUrl?: string): string {
  if (!videoUrl) return '';
  // Pass through absolute URLs
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }

  if (useR2 && isIpfs(videoUrl)) {
    const hash = videoUrl.replace('ipfs://', '');
    return `${r2BaseUrl}/${hash}/index`;
  }

  return `${pinataGateway}/${videoUrl.replace(ipfsProtocol, '')}`;
}

// getDownloadUrl: Checks if MP4 exists, falls back to original file
// Returns { url, extension } for the download
export async function getDownloadUrl(videoUrl?: string): Promise<{ url: string; extension: string }> {
  if (!videoUrl) return { url: '', extension: '' };
  
  // Pass through absolute URLs
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    // Try to determine extension from URL
    const ext = videoUrl.split('.').pop()?.toLowerCase() || 'mp4';
    return { url: videoUrl, extension: ext };
  }

  const mp4Url = downloadSrc(videoUrl);
  const origUrl = originalSrc(videoUrl);

  try {
    // Check if MP4 exists
    const response = await fetch(mp4Url, { method: 'HEAD' });
    if (response.ok) {
      return { url: mp4Url, extension: 'mp4' };
    }
  } catch {
    // MP4 doesn't exist, continue to fallback
  }

  // Fallback to original file - check content type to determine extension
  try {
    const response = await fetch(origUrl, { method: 'HEAD' });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let extension = 'mp4'; // default
      if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
        extension = 'mp3';
      } else if (contentType.includes('audio/wav') || contentType.includes('audio/wave')) {
        extension = 'wav';
      } else if (contentType.includes('audio/aiff')) {
        extension = 'aiff';
      } else if (contentType.includes('video/mp4')) {
        extension = 'mp4';
      }
      return { url: origUrl, extension };
    }
  } catch {
    // If all fails, return MP4 URL as last resort
  }

  return { url: mp4Url, extension: 'mp4' };
}

// mp4Src: Returns the transcoded MP4 URL (only exists for migrated video content)
// Use downloadSrc() for downloads - it works for all file types
export function mp4Src(videoUrl?: string): string {
  if (!videoUrl) return '';
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }

  if (useR2 && isIpfs(videoUrl)) {
    const hash = videoUrl.replace('ipfs://', '');
    return `${r2BaseUrl}/${hash}/mp4/index.mp4`;
  }

  return `${pinataGateway}/${videoUrl.replace(ipfsProtocol, '')}`;
}

// New imageSrc for R2 - no extension needed, just like IPFS!
export function imageSrc(imageUrl?: string): string {
  if (!imageUrl) return '';

  if (useR2 && isIpfs(imageUrl)) {
    const hash = imageUrl.replace('ipfs://', '');
    return `${r2BaseUrl}/${hash}/index`; // No extension - Content-Type header handles format
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
    // Use R2 for consistency with imageSrc
    if (useR2) {
      const hash = imageUrl.replace('ipfs://', '');
      return `${r2BaseUrl}/${hash}/index`;
    }
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
    // Use R2 for consistency with imageSrc
    if (useR2) {
      const hash = imageUrl.replace('ipfs://', '');
      return `${r2BaseUrl}/${hash}/index`;
    }
    return `${pinataGateway}/${imageUrl.replace(ipfsProtocol, '')}`;
  }
  
  // For cloudinary images, transform to medium size
  return imageUrl.split('/upload/').join('/upload/w_500/');
}
