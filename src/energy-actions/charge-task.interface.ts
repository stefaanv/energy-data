import {
  addDays,
  addSeconds,
  differenceInCalendarDays,
  differenceInDays,
  getTime,
  parseISO,
} from 'date-fns'
import { omit } from 'radash'

export type ChargeMode = 'charge' | 'discharge'
export type Percentage = number

/**
 * Only date or dateRelative should be provided
 */
export interface IChargeTask {
  id: number
  mode: ChargeMode
  from: Date
  till: Date
  power: number
  target?: number
  holdOff?: Percentage
}

export type IChargeTaskWire = Omit<IChargeTask, 'from' | 'till'> & {
  from: string
  till: string
}

export function chargeTaskFromWire(value: IChargeTaskWire): IChargeTask {
  return {
    ...omit(value, ['from', 'till']),
    from: parseISO(value.from),
    till: parseISO(value.till),
  }
}

function splitDate(value: Date) {
  const split = value.toISOString().split('T')
  if (split.length != 2) throw new Error(`${value} is not a valid ISO date`)
}

export function relDate(value: Date, now = new Date()) {
  return differenceInCalendarDays(value, now)
}

function datePart(value: Date) {
  return splitDate(value)[0]
}

function timePart(value: Date) {
  return splitDate(value)[1]
}

function joinDate(timePart: string, datePart: string) {
  return new Date(timePart + 'T' + datePart)
}
