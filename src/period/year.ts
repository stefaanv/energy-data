import { isString } from 'radash'
import { IPeriod } from '.'

export class Year implements IPeriod {
  protected readonly year: number

  constructor(year: string)
  constructor(year: number)
  constructor(year: number | string) {
    if (isString(year)) {
      if (!Year.isValidLabel(year)) throw new Error(`${year} is not a valid year label`)
      this.year = parseInt(year)
    } else {
      if (!Year.isValidNumeric(year)) throw new Error(`${year} is not a valid year`)
      this.year = year
    }
  }
  get from() {
    return new Date(this.year, 0, 1)
  }

  get till() {
    return new Date(this.year + 1, 0, 1)
  }

  get label() {
    return ('0000' + this.year.toString()).slice(-4)
  }

  static isValidLabel(label: string): boolean {
    return /^[0-9]{1,4}$/.test(label.trim())
  }

  static isValidNumeric(year: number, ..._args: number[]): boolean {
    return year >= 0 && year < 10000
  }
}
