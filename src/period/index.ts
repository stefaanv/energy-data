import { Month } from './month'
import { Year } from './year'
import { Day } from './day'

export interface IPeriod {
  readonly from: Date
  readonly till: Date
  readonly label: string
  // static isValid: (...args: [string] | number[]) => boolean
}

export type Period = Year | Month | Day
