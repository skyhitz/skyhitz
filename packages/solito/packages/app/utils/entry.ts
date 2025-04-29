/**
 * Utility functions for entry-related operations
 */

/**
 * Formats the image URL to return the medium-sized version
 * @param imageUrl Original image URL
 * @returns URL for medium-sized image
 */
export function imageUrlMedium(imageUrl?: string): string {
  if (!imageUrl) {
    return 'https://skyhitz.io/icon.png';
  }
  
  // If the URL is already an IPFS URL, return it as is
  if (imageUrl.includes('ipfs://') || imageUrl.includes('ipfs.io')) {
    return imageUrl;
  }
  
  // If it's a cloud image URL, transform it to medium size
  if (imageUrl.includes('cloudinary')) {
    // Replace with medium transformation if it exists
    return imageUrl.replace('/upload/', '/upload/w_600,h_600,c_fill/');
  }
  
  // Return original URL if no transformations apply
  return imageUrl;
}
