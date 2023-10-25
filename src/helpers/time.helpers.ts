import { isBefore } from 'date-fns'

export function isBetween(date: Date, from: Date, till: Date) {
  const result = isBefore(date, till) && isBefore(from, date)
  return result
}
