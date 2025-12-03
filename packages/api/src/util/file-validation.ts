/**
 * File validation utility with magic byte verification
 * Prevents XSS and malicious file uploads by validating actual file content
 */

// Magic bytes (file signatures) for allowed file types
const MAGIC_BYTES: Record<string, { signature: number[]; offset?: number; mask?: number[] }[]> = {
  // Images
  'image/jpeg': [
    { signature: [0xff, 0xd8, 0xff] },
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF at start
    // Also need to check WEBP at offset 8, handled separately
  ],
  'image/bmp': [
    { signature: [0x42, 0x4d] }, // BM
  ],
  'image/svg+xml': [], // SVG is text-based, requires special handling
  
  // Audio
  'audio/mpeg': [
    { signature: [0xff, 0xfb] }, // MP3 frame sync
    { signature: [0xff, 0xf3] }, // MP3 frame sync
    { signature: [0xff, 0xf2] }, // MP3 frame sync
    { signature: [0x49, 0x44, 0x33] }, // ID3 tag
  ],
  'audio/mp4': [
    { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  ],
  'audio/m4a': [
    { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  ],
  'audio/aiff': [
    { signature: [0x46, 0x4f, 0x52, 0x4d] }, // FORM
  ],
  'audio/x-aiff': [
    { signature: [0x46, 0x4f, 0x52, 0x4d] }, // FORM
  ],
  'audio/wav': [
    { signature: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  ],
  'audio/x-wav': [
    { signature: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  ],
  'audio/flac': [
    { signature: [0x66, 0x4c, 0x61, 0x43] }, // fLaC
  ],
  'audio/ogg': [
    { signature: [0x4f, 0x67, 0x67, 0x53] }, // OggS
  ],
  
  // Video
  'video/mp4': [
    { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  ],
  'video/webm': [
    { signature: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML
  ],
};

// File extension to MIME type mapping
const EXTENSION_TO_MIME: Record<string, string[]> = {
  // Images
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.bmp': ['image/bmp'],
  
  // Audio
  '.mp3': ['audio/mpeg'],
  '.mp4': ['audio/mp4', 'video/mp4'],
  '.m4a': ['audio/mp4', 'audio/m4a'],
  '.aiff': ['audio/aiff', 'audio/x-aiff'],
  '.aif': ['audio/aiff', 'audio/x-aiff'],
  '.wav': ['audio/wav', 'audio/x-wav'],
  '.flac': ['audio/flac'],
  '.ogg': ['audio/ogg'],
  
  // Video
  '.webm': ['video/webm'],
};

// Allowed MIME types by category
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/m4a',
  'audio/aiff',
  'audio/x-aiff',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/ogg',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  sanitizedContentType?: string;
}

/**
 * Check if a byte array matches a signature at a given offset
 */
function matchesSignature(
  bytes: Uint8Array,
  signature: number[],
  offset: number = 0
): boolean {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Detect MIME type from magic bytes
 */
export function detectMimeTypeFromBytes(bytes: Uint8Array): string | null {
  // Check for JPEG
  if (matchesSignature(bytes, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }
  
  // Check for PNG
  if (matchesSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  
  // Check for GIF
  if (matchesSignature(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
      matchesSignature(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
    return 'image/gif';
  }
  
  // Check for WebP (RIFF....WEBP)
  if (matchesSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes.length >= 12) {
    const webpSig = [0x57, 0x45, 0x42, 0x50]; // WEBP
    if (matchesSignature(bytes, webpSig, 8)) {
      return 'image/webp';
    }
    // Check for WAV (RIFF....WAVE)
    const waveSig = [0x57, 0x41, 0x56, 0x45]; // WAVE
    if (matchesSignature(bytes, waveSig, 8)) {
      return 'audio/wav';
    }
  }
  
  // Check for BMP
  if (matchesSignature(bytes, [0x42, 0x4d])) {
    return 'image/bmp';
  }
  
  // Check for MP3 (ID3 tag)
  if (matchesSignature(bytes, [0x49, 0x44, 0x33])) {
    return 'audio/mpeg';
  }
  
  // Check for MP3 (frame sync)
  if (bytes.length >= 2 && bytes[0] === 0xff && 
      (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2)) {
    return 'audio/mpeg';
  }
  
  // Check for MP4/M4A (ftyp at offset 4)
  if (bytes.length >= 12 && matchesSignature(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    // Check the brand to differentiate audio from video
    const brand = new TextDecoder('ascii').decode(bytes.slice(8, 12));
    if (brand === 'M4A ' || brand === 'M4B ' || brand === 'F4A ') {
      return 'audio/mp4';
    }
    return 'video/mp4'; // Default to video for other ftyp brands
  }
  
  // Check for AIFF (FORM....AIFF)
  if (matchesSignature(bytes, [0x46, 0x4f, 0x52, 0x4d]) && bytes.length >= 12) {
    const aiffSig = [0x41, 0x49, 0x46, 0x46]; // AIFF
    if (matchesSignature(bytes, aiffSig, 8)) {
      return 'audio/aiff';
    }
  }
  
  // Check for FLAC
  if (matchesSignature(bytes, [0x66, 0x4c, 0x61, 0x43])) {
    return 'audio/flac';
  }
  
  // Check for OGG
  if (matchesSignature(bytes, [0x4f, 0x67, 0x67, 0x53])) {
    return 'audio/ogg';
  }
  
  // Check for WebM (EBML)
  if (matchesSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
    return 'video/webm';
  }
  
  return null;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Validate a file for image upload (avatars, backgrounds)
 */
export function validateImageFile(
  file: File,
  content: Uint8Array
): FileValidationResult {
  const filename = file.name;
  const claimedType = file.type?.toLowerCase() || '';
  const extension = getFileExtension(filename);
  
  // Check file extension
  if (!extension || !EXTENSION_TO_MIME[extension]) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${Object.keys(EXTENSION_TO_MIME).filter(ext => 
        EXTENSION_TO_MIME[ext].some(t => ALLOWED_IMAGE_TYPES.includes(t))
      ).join(', ')}`,
    };
  }
  
  // Check if extension maps to an allowed image type
  const allowedTypesForExtension = EXTENSION_TO_MIME[extension];
  const isImageExtension = allowedTypesForExtension.some(t => ALLOWED_IMAGE_TYPES.includes(t));
  if (!isImageExtension) {
    return {
      valid: false,
      error: `File extension ${extension} is not an allowed image type. Allowed: .jpg, .jpeg, .png, .gif, .webp`,
    };
  }
  
  // Detect actual file type from magic bytes
  const detectedType = detectMimeTypeFromBytes(content);
  
  if (!detectedType) {
    return {
      valid: false,
      error: 'Unable to determine file type. File may be corrupted or unsupported.',
    };
  }
  
  // Verify detected type is an allowed image type
  if (!ALLOWED_IMAGE_TYPES.includes(detectedType)) {
    return {
      valid: false,
      error: `Detected file type (${detectedType}) is not an allowed image type. Allowed: JPEG, PNG, GIF, WebP`,
    };
  }
  
  // Verify consistency between extension and detected type
  const expectedTypesForExtension = EXTENSION_TO_MIME[extension] || [];
  if (!expectedTypesForExtension.includes(detectedType)) {
    return {
      valid: false,
      error: `File content does not match extension. Extension suggests ${expectedTypesForExtension.join(' or ')}, but content is ${detectedType}`,
    };
  }
  
  return {
    valid: true,
    detectedType,
    sanitizedContentType: detectedType,
  };
}

/**
 * Validate a file for audio upload
 */
export function validateAudioFile(
  file: File,
  content: Uint8Array
): FileValidationResult {
  const filename = file.name;
  const extension = getFileExtension(filename);
  
  // Check file extension
  const validAudioExtensions = ['.mp3', '.mp4', '.m4a', '.aiff', '.aif', '.wav', '.flac', '.ogg'];
  if (!extension || !validAudioExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${validAudioExtensions.join(', ')}`,
    };
  }
  
  // Detect actual file type from magic bytes
  const detectedType = detectMimeTypeFromBytes(content);
  
  if (!detectedType) {
    return {
      valid: false,
      error: 'Unable to determine file type. File may be corrupted or unsupported.',
    };
  }
  
  // For audio/video, be more flexible (e.g., .mp4 can be audio or video container)
  const isAudioType = ALLOWED_AUDIO_TYPES.includes(detectedType);
  const isVideoType = ALLOWED_VIDEO_TYPES.includes(detectedType);
  
  // .mp4 and .m4a can contain either audio or video
  if (extension === '.mp4' || extension === '.m4a') {
    if (!isAudioType && !isVideoType) {
      return {
        valid: false,
        error: `Detected file type (${detectedType}) is not a valid audio/video format`,
      };
    }
  } else if (!isAudioType) {
    return {
      valid: false,
      error: `Detected file type (${detectedType}) is not an allowed audio type`,
    };
  }
  
  return {
    valid: true,
    detectedType,
    sanitizedContentType: detectedType,
  };
}

/**
 * Validate any file with allowed types
 */
export function validateFile(
  file: File,
  content: Uint8Array,
  allowedTypes: string[]
): FileValidationResult {
  // Detect actual file type from magic bytes
  const detectedType = detectMimeTypeFromBytes(content);
  
  if (!detectedType) {
    return {
      valid: false,
      error: 'Unable to determine file type. File may be corrupted or unsupported.',
    };
  }
  
  if (!allowedTypes.includes(detectedType)) {
    return {
      valid: false,
      error: `File type ${detectedType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  return {
    valid: true,
    detectedType,
    sanitizedContentType: detectedType,
  };
}

