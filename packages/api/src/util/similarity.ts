/**
 * Utility functions for detecting similar tracks based on metadata
 */

/**
 * Calculate Levenshtein distance between two strings
 * (edit distance - minimum number of single-character edits to transform one string to another)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Increment along the first column of each row
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity ratio between two strings (0-1, where 1 is identical)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  
  return 1 - distance / maxLen;
}

/**
 * Normalize a string for comparison (remove special chars, extra spaces, etc.)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');   // Normalize whitespace
}

/**
 * Check if two tracks are similar based on metadata
 * Returns a similarity score from 0 to 1
 */
export function calculateTrackSimilarity(track1: {
  title: string;
  artist?: string;
  source?: string;
  sourceId?: string;
}, track2: {
  title: string;
  artist?: string;
  source?: string;
  sourceId?: string;
}): number {
  // Exact match on source and sourceId = definite duplicate
  if (track1.source && track2.source && 
      track1.sourceId && track2.sourceId &&
      track1.source === track2.source && 
      track1.sourceId === track2.sourceId) {
    return 1.0;
  }

  // Calculate title similarity
  const titleSim = stringSimilarity(
    normalizeString(track1.title),
    normalizeString(track2.title)
  );

  // Calculate artist similarity (if both have artists)
  let artistSim = 1.0; // Default to perfect match if no artist to compare
  if (track1.artist && track2.artist) {
    artistSim = stringSimilarity(
      normalizeString(track1.artist),
      normalizeString(track2.artist)
    );
  }

  // Weighted average: title is more important than artist
  // Title: 70%, Artist: 30%
  return titleSim * 0.7 + artistSim * 0.3;
}

/**
 * Find similar tracks in a list based on metadata
 * Returns matches with similarity >= threshold
 */
export interface SimilarTrack {
  track: any;
  similarity: number;
}

export function findSimilarTracks(
  newTrack: {
    title: string;
    artist?: string;
    source?: string;
    sourceId?: string;
  },
  existingTracks: Array<{
    id: string;
    title: string;
    artist?: string;
    source?: string;
    sourceId?: string;
    [key: string]: any;
  }>,
  threshold: number = 0.8
): SimilarTrack[] {
  const similar: SimilarTrack[] = [];

  for (const track of existingTracks) {
    const similarity = calculateTrackSimilarity(newTrack, track);
    
    if (similarity >= threshold) {
      similar.push({ track, similarity });
    }
  }

  // Sort by similarity (highest first)
  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Check if a track is likely a duplicate
 * Returns true if similarity is very high (>= 0.9)
 */
export function isLikelyDuplicate(track1: {
  title: string;
  artist?: string;
  source?: string;
  sourceId?: string;
}, track2: {
  title: string;
  artist?: string;
  source?: string;
  sourceId?: string;
}): boolean {
  return calculateTrackSimilarity(track1, track2) >= 0.9;
}

