import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { omit } from 'radash'
import { IChargeTask } from './charge-task.interface'

export type ChargeMode = 'charge' | 'discharge'
export type Percentage = number

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

export function relDate(value: Date, now = new Date()) {
  return differenceInCalendarDays(value, now)
}

export function dateFromRelative(
  relDate: string,
  hours: string,
  minutes: string,
  now = new Date(),
) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()
  const h = parseInt(hours)
  const m = parseInt(minutes)
  const d = new Date(year, month, date, h, m, 0)
  const dPlus = addDays(d, parseInt(relDate))
  return dPlus
}
