import { isString } from 'radash'
import { IPeriod } from '.'
import { Year } from './year'

export class Month extends Year implements IPeriod {
  protected readonly month: number

  constructor(year_month: string)
  constructor(year: number, month: number)
  constructor(arg1: number | string, arg2?: number) {
    if (isString(arg1)) {
      if (!Month.isValid(arg1)) throw new Error(`${arg1} is not a valid month label`)
      const [year, month] = arg1.split('-')
      super(year)
      this.month = parseInt(month)
    } else {
      if (!Year.isValid(arg1)) throw new Error(`${arg1} is not a valid year`)
      if (!Month.isValid(arg1, arg2)) throw new Error(`${arg2} is not a valid month`)
      super(arg1)
      this.month = arg2
    }
  }

  get from() {
    return new Date(this.year, this.month - 1, 1)
  }
  get till() {
    if (this.month == 12) return new Date(this.year + 1, 0, 1)
    return new Date(this.year, this.month, 1)
  }
  get label() {
    return super.label + `-${('00' + this.month.toString()).slice(-2)}`
  }

  static isValid(label: string): boolean
  static isValid(year: number, month: number): boolean
  static isValid(arg1: string | number, month?: number): boolean {
    if (isString(arg1)) return /[0-9]{4}-(0[1-9]|10|11|12)/.test(arg1)
    return Year.isValid(arg1) && month > 0 && month < 13
  }
}
