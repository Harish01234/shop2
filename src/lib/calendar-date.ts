const BUSINESS_TIME_ZONE = 'Asia/Kolkata'
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
const DATE_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/

function utcYmd(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toValidDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/** Calendar day the user meant, as YYYY-MM-DD. Safe for date inputs. */
export function toDateInput(value: unknown) {
  if (value == null || value === '') return ''
  const date = toValidDate(value)
  if (!date) return ''

  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()

  // UTC midnight and UTC end-of-day are stored calendar days, not wall clocks.
  if (
    (hours === 0 && minutes === 0 && seconds === 0) ||
    (hours === 23 && minutes === 59 && seconds === 59)
  ) {
    return utcYmd(date)
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function toCalendarDay(value: Date | string) {
  const day = toDateInput(value)
  if (!day) {
    throw new RangeError('Invalid calendar date')
  }
  return day
}

/** Store a picked YYYY-MM-DD as UTC midnight of that calendar day. */
export function parseDateInput(value: string) {
  const match = DATE_INPUT.exec(value.trim())
  if (!match) {
    throw new RangeError('Invalid calendar date')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('Invalid calendar date')
  }

  return date
}

export function canonicalizeCalendarDate(value: Date | string) {
  return parseDateInput(toCalendarDay(value))
}

export function canonicalizeOptionalCalendarDate(
  value: Date | string | null | undefined,
) {
  if (value === undefined) return undefined
  if (value === null) return null
  return canonicalizeCalendarDate(value)
}

/**
 * Inclusive start of a business calendar day.
 * Stored values are UTC midnight of YYYY-MM-DD. Query bounds use Asia/Kolkata
 * midnight so both UTC midnight and legacy IST midnight instants match.
 */
export function dayStart(value: string) {
  return new Date(parseDateInput(value).getTime() - IST_OFFSET_MS)
}

/** Inclusive end of the business calendar day (Asia/Kolkata 23:59:59.999). */
export function dayEnd(value: string) {
  return new Date(dayStart(value).getTime() + 24 * 60 * 60 * 1000 - 1)
}

export function inclusivePeriod(
  periodStart: Date | string,
  periodEnd: Date | string,
) {
  return {
    periodStart: dayStart(toCalendarDay(periodStart)),
    periodEnd: dayEnd(toCalendarDay(periodEnd)),
  }
}

export function uniqueCalendarDays(
  values: Array<Date | string | null | undefined>,
) {
  const days = new Set<string>()
  for (const value of values) {
    const day = toDateInput(value)
    if (day) days.add(day)
  }
  return [...days]
}

export function formatCalendarDate(
  value: Date | string | null | undefined,
  fallback = '—',
) {
  const day = toDateInput(value)
  if (!day) return fallback

  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parseDateInput(day))
  } catch {
    return fallback
  }
}

export function todayDateInput() {
  return toDateInput(new Date())
}
