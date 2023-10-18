import { addDays, parse, parseISO } from 'date-fns'
import { isDate } from 'radash'

const TIME_REGEX = /(?<hours>[0-9]{1,2}):(?<minutes>[0-9]{2})(:(?<seconds>[0-9]{2}))?/
const DMY_REGEX = /(?<date>[0-9]{1,2}[-\/][0-9]{2}[-\/][0-9]{4})/
const YMD_REGEX = /(?<date>[0-9]{4}[-\/][0-9]{2}[-\/][0-9]{2})/
const timeZone = 'Europe/Brussels'
const TZ_OPTS = { timeZone }

export function timeToFraction(value: Date | string): number {
  if (isDate(value)) {
    return (1 / 24) * (value.getHours() + value.getMinutes() / 60 + value.getSeconds() / 3600)
  }
  const match = value.match(TIME_REGEX)
  if (!match) throw new Error(`"${value}" is not valid time string`)

  return (
    (1 / 24) *
    (parseInt(match.groups.hours) +
      parseInt(match.groups.minutes) / 60 +
      parseInt(match.groups.seconds ?? '0') / 3600)
  )
}

/*
export class Time implements ITime {
  static timeZone = 'Europe/Brussels'
  hour: number
  minutes: number
  seconds = 0
  date?: Date = undefined

  constructor(args: ITime) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    this.hour = args.hour
    this.minutes = args.minutes
    this.seconds = args.seconds
    if (args.dateRelative) {
      this.date = addDays(today, args.dateRelative)
    } else {
      if (isDate(args.date)) {
        this.date = args.date
      } else {
        this.date = parseISO(args.date)
      }
    }
  }

  get dayIsSpecified() {
    return this.date !== undefined
  }

  toString() {
    if (this.dayIsSpecified) return
  }
}

export function parseTime(value: string) {
  const time = parse(value, 'HH:mm:ss', new Date())
  return new Time({
    hour: time.getHours(),
    minutes: time.getMinutes(),
    seconds: time.getSeconds(),
  })
}

export function parseDateTime(value: string) {
  const datetime = parse(value, 'dd/MM/yyyy HH:mm:ss', new Date())
  return new Time({
    hour: datetime.getHours(),
    minutes: datetime.getMinutes(),
    seconds: datetime.getSeconds(),
    date: datetime,
  })
}
*/
