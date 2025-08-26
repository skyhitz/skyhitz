/**
 * Converts Stellar stroops to lumens
 * 1 XLM (lumen) = 10,000,000 stroops
 * 
 * @param {number} stroops - The amount in stroops
 * @returns {string} - The formatted amount in lumens
 */
export function stroopsToLumens(stroops: number): string {
  if (!stroops) return "0";
  
  // Convert to lumens (1 XLM = 10,000,000 stroops)
  const lumens = stroops / 10000000;
  
  // For very small amounts, use scientific notation
  if (lumens < 0.0001) {
    return lumens.toExponential(0);
  }
  
  // For small amounts, show limited decimal places
  if (lumens < 1) {
    return lumens.toFixed(0);
  }
  
  // For larger amounts, format with commas and no decimal places
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(lumens);
}
