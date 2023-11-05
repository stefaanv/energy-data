import { LoggerService } from './logger.service'
import { MikroORM } from '@mikro-orm/sqlite'
import ormConfig from '@src/mikro-orm.config'
import { resolve } from 'path'
import { last } from 'radash'
import { Parser, Options } from 'csv-parse'
import { OptionsWithTZ, format } from 'date-fns-tz'
import { isEqual, parse } from 'date-fns'
import { createReadStream } from 'fs'
import { QuarterlyEntity } from './entities/quarterly'
import { HR_DB_TIME_FORMAT } from './helpers/time.helpers'
import { round } from './helpers/number.helper'

const TZ_OPTIONS: OptionsWithTZ = { timeZone: 'Europe/Brussels' }
const CSV_DATE_FORMAT = 'dd-MM-yyyy'
const CSV_TIME_FORMAT = 'HH:mm:ss'

// Van Datum;Van Tijdstip;Tot Datum;Tot Tijdstip;EAN;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus
// 25-05-2021;00:00:00;25-05-2021;00:15:00;="541448860004107822";1SAG1100302657;Digitale Meter;Afname Nacht;0,082;kWh;Gevalideerd
// 25-05-2021;00:00:00;25-05-2021;00:15:00;="541448860004107822";1SAG1100302657;Digitale Meter;Injectie Nacht;0,000;kWh;Gevalideerd

const parseOptions: Options = {
  delimiter: [';', ';='],
  quote: false,
  from: 2,
  columns: ['startDate', 'startTime', '1', '2', '3', '4', '5', 'meter', 'value', '7', '8'],
}

interface RawData {
  startDate: string
  startTime: string
  meter: string
  value: string
}

interface Data {
  startTime: Date
  injection: number
  consumption: number
}

async function main(args: string[]) {
  // set up the application and logging
  const logger = new LoggerService('main')
  const orm = await MikroORM.init({
    ...ormConfig,
    type: 'sqlite',
  })
  const fileName = last(args)
  const fullPath = resolve(__dirname, '../data', fileName)
  const list: Data[] = []
  let counter = 0
  const em = orm.em.fork()
  let collector: Data = { startTime: new Date(), injection: -1, consumption: -1 }

  const parser = new Parser(parseOptions)
  createReadStream(fullPath).pipe(parser)
  for await (const rawData of parser) {
    const startTime = parse(
      rawData.startDate + ' ' + rawData.startTime,
      CSV_DATE_FORMAT + ' ' + CSV_TIME_FORMAT,
      new Date(),
    )
    const meter = rawData.meter.split(' ')[0] as 'Afname' | 'Injectie'
    const value = parseFloat(rawData.value.replace(',', '.')) * 1000

    if (isEqual(startTime, collector.startTime)) {
      collector[meter === 'Afname' ? 'consumption' : 'injection'] = value
      const dbRec = await em.findOne(QuarterlyEntity, { startTime: collector.startTime })
      if (!dbRec) {
        await em.insert(QuarterlyEntity, {
          startTime: collector.startTime,
          hrTime: format(collector.startTime, HR_DB_TIME_FORMAT, TZ_OPTIONS),
          gridConsumed: round(collector.consumption) ?? -1,
          gridProduced: round(collector.injection) ?? -1,
          monthlyPeak: -1,
          batterySoc: -1,
        })
        await em.flush()
      } else {
        dbRec.gridConsumed = round(collector.consumption) ?? -1
        dbRec.gridProduced = round(collector.injection) ?? -1
      }
      collector = { startTime: new Date(), injection: -1, consumption: -1 }
    } else {
      collector.startTime = startTime
      collector[meter === 'Afname' ? 'consumption' : 'injection'] = value
    }
    counter++
    if (counter % 1000 === 0) console.log(counter)
  }

  await orm.close()
}
main(process.argv)
