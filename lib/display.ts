type DollarsOptions = {
  value: number
  includeSymbol?: boolean
  decimals?: number
}

export function dollars({ value, includeSymbol = true, decimals = 2 }: DollarsOptions): string {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    currencyDisplay: includeSymbol ? "symbol" : "code",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }

  const formatter = new Intl.NumberFormat("en-US", options)
  return formatter.format(value)
}

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24
const MILLISECONDS_PER_DAY = 1000 * SECONDS_PER_DAY
const MILLISECONDS_PER_HOUR = 1000 * SECONDS_PER_HOUR
export const MILLISECONDS_PER_MINUTE = 1000 * SECONDS_PER_MINUTE

export function toDays(unixTimestamp: number) {
  const now = new Date().getTime()
  const daysInSeconds = unixTimestamp * 1000 - now

  const days = Math.floor(daysInSeconds / MILLISECONDS_PER_DAY)

  // console.log("toDays", { unixTimestamp, now, daysInSeconds, MILLISECONDS_PER_DAY, days })
  return days < 0 ? 0 : days
}

export function toHours(unixTimestamp: number) {
  const now = new Date().getTime()
  const daysInSeconds = unixTimestamp * 1000 - now
  let hours = Math.floor((daysInSeconds % MILLISECONDS_PER_DAY) / MILLISECONDS_PER_HOUR)
  // console.log("toDays", unixTimestamp, now, daysInSeconds, hours)

  return hours < 0 ? 0 : hours
}

export default function loanStatus(deadlineNext: number) {
  const now = new Date().getTime()
  const daysInSeconds = deadlineNext * 1000 - now

  if (daysInSeconds <= 0) {
    return {
      displayText: "DEFAULT",
      className: "text-red-500",
    }
  }
  return {
    displayText: "LIVE",
    className: "text-green-500",
  }
}
