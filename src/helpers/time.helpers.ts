import { isBefore } from 'date-fns'
import { OptionsWithTZ } from 'date-fns-tz'

export function isBetween(date: Date, from: Date, till: Date) {
  const result = isBefore(date, till) && isBefore(from, date)
  return result
}

export const TZ_OPTIONS: OptionsWithTZ = { timeZone: 'Europe/Brussels' }
export const HR_DB_TIME_FORMAT = 'd/M/yyyy HH:mm'
