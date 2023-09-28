import { Month } from './month'
import { Year } from './year'

export interface IPeriod {
  readonly from: Date
  readonly till: Date
  readonly label: string
  // static isValid: (...args: [string] | number[]) => boolean
}

export type Period = Year | Month
