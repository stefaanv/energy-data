import { isString, last } from 'radash'
import { IPeriod } from '.'
import { Month } from './month'
import { Year } from './year'

export class Day extends Month implements IPeriod {
  protected readonly day: number

  constructor(year_month_day: string)
  constructor(year: number, month: number, day: number)
  constructor(arg1: number | string, month?: number, day?: number) {
    if (isString(arg1)) {
      if (!Day.isValidLabel(arg1)) throw new Error(`${arg1} is not a valid day label`)
      const [yearMonth, day] = Day.split(arg1)
      super(yearMonth)
      this.day = parseInt(day)
    } else {
      if (!Year.isValidNumeric(arg1)) throw new Error(`${arg1} is not a valid year`)
      if (!Month.isValidNumeric(arg1, month)) throw new Error(`${month} is not a valid month`)
      if (!Day.isValidNumeric(arg1, month, day)) throw new Error(`${day} is not a valid day`)
      super(arg1, month)
      this.day = day
    }
  }

  static split(label: string) {
    const parts = label.split('-')
    const dayPart = last(parts)
    const yearMonthPart = parts.slice(0, parts.length - 1).join('-')
    return [yearMonthPart, dayPart]
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
    const [yearMonth, day] = Day.split(label)
    if (!Month.isValidLabel(yearMonth)) return false
    const [year, month] = yearMonth.split('-')
    return this.isValidNumeric(parseInt(year), parseInt(month), parseInt(day))
  }

  static isValidNumeric(year: number, month: number, day: number): boolean {
    if (!Month.isValidNumeric(year, month)) return false
    if (day < 1) return false
    const maxDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
    return day <= maxDays
  }
}
