import { isString } from 'radash'
import { IPeriod } from '.'
import { Year } from './year'

export class Month extends Year implements IPeriod {
  protected readonly month: number

  constructor(year_month: string)
  constructor(year: number, month: number)
  constructor(arg1: number | string, month?: number) {
    if (isString(arg1)) {
      if (!Month.isValidLabel(arg1)) throw new Error(`${arg1} is not a valid month label`)
      const [year, month] = arg1.split('-')
      super(year)
      this.month = parseInt(month)
    } else {
      if (!Year.isValidNumeric(arg1)) throw new Error(`${arg1} is not a valid year`)
      if (!Month.isValidNumeric(arg1, month)) throw new Error(`${month} is not a valid month`)
      super(arg1)
      this.month = month
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

  static isValidLabel(label: string): boolean {
    return /^[0-9]{1,4}-(0[1-9]|10|11|12)$/.test(label.trim())
  }

  static isValidNumeric(year: number, month: number, ..._args: number[]): boolean {
    return Year.isValidNumeric(year) && month > 0 && month < 13
  }
}
