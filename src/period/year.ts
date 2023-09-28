import { isString } from 'radash'
import { IPeriod } from '.'

export class Year implements IPeriod {
  protected readonly year: number

  constructor(year: string)
  constructor(year: number)
  constructor(year: number | string) {
    if (isString(year)) {
      if (!Year.isValid(year)) throw new Error(`${year} is not a valid year label`)
      this.year = parseInt(year)
    } else {
      if (!Year.isValid(year)) throw new Error(`${year} is not a valid year`)
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

  static isValid(arg1: string | number): boolean {
    if (isString(arg1)) return /[0-9]{4}/.test(arg1)
    return arg1 >= 0 && arg1 < 10000
  }

  static parse(label: string) {
    return new Year(label)
  }
}
