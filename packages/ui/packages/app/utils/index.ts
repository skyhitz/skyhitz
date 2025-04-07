export function isSome<T>(maybe: T | null | undefined): maybe is T {
  return maybe !== null && maybe !== undefined
}

export function formattedDate(publishedAtTimestamp: number) {
  const formatedDate = new Date(publishedAtTimestamp).toLocaleDateString(
    'en-us',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  )
  return formatedDate
}

export function formattedISODate(publishedAtTimestamp: number) {
  const formatedDate = new Date(publishedAtTimestamp).toISOString()
  return formatedDate
}

export function convertToString(num: number, fractionDigits = 6): string {
  return parseFloat(num.toFixed(fractionDigits)).toString()
}

export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const lumensToStroops = (lumens: number) => lumens * 10000000

export const stroopsToLumens = (stroops: number) => stroops / 10000000
