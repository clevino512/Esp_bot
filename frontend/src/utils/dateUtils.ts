/**
 * Parse timestamps returned by the API.
 *
 * Older backend records are UTC datetimes without a timezone suffix
 * (for example: "2026-09-02T16:20:00"). Treat those values as UTC instead
 * of letting the browser interpret them as local time.
 */
export function parseApiDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value
  }

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}