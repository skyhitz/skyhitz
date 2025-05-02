/**
 * Format a number to US currency format (e.g. $123.45)
 * @param value - The number to format
 * @returns Formatted string with $ and commas
 */
export function formatToUSCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a number to a percentage string
 * @param value - The number to format as percentage
 * @param digits - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatToPercentage(value: number, digits: number = 2): string {
  return `${value.toFixed(digits)}%`;
}
