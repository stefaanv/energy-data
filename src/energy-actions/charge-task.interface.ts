import { differenceInCalendarDays, parseISO } from 'date-fns'
import { omit } from 'radash'
import { IChargeTaskWire } from '../shared-models/charge-task.wire.interface'

export type ChargeMode = 'charge' | 'discharge'
export type Percentage = number

/**
 * Only date or dateRelative should be provided
 */
export type IChargeTask = Omit<IChargeTaskWire, 'from' | 'till'> & {
  from: Date
  till: Date
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
