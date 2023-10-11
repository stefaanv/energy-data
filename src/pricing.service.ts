import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Inject, Injectable } from '@nestjs/common'
import * as axios from 'axios'
import {} from 'axios'

import {
  DYN_PRICING_CKEY,
  DYN_PRICING_URL_CKEY,
  DYN_PRICING_PARAMS_CKEY,
} from './config-validator.joi'
import { LoggerService } from './logger.service'
import { addHours, isBefore, parseISO } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'
import { DRIZZLE_CONNECTION } from './drizzle/drizzle.module'
import Database from 'better-sqlite3'
import * as schema from './drizzle/schema'

type GetParams = Record<string, string | number>

@Injectable()
export class PricingService {
  private readonly _url: string
  private readonly _urlParams: GetParams
  private _timeZone: string

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
    @Inject(DRIZZLE_CONNECTION) private readonly _conn: Database<typeof schema>,
  ) {
    this._url = config.get([DYN_PRICING_CKEY, DYN_PRICING_URL_CKEY])
    this._urlParams = config.get<GetParams>([DYN_PRICING_CKEY, DYN_PRICING_PARAMS_CKEY])
    this._timeZone = config.get('timeZone')
  }

  async loadCurrentPricingData() {
    try {
      const uri = axios.getUri({ url: this._url, params: this._urlParams })
      const aresult = await axios.get<SpotResult>(uri)
      const spotPrices = new TransformedSpotResult(aresult.data, this._timeZone)
      const qResult = await this._conn
        .select()
        .from(schema.electricityPrice)
        .orderBy(schema.electricityPrice.periodStart)
        .limit(1)
      const lastKnowPrice = qResult.length === 0 ? new Date(1970, 1) : qResult[0]
      console.log('lastKnowPrice', lastKnowPrice)
      const newPrices = spotPrices.data.filter(dp => isBefore(lastKnowPrice, dp.startTime))

      const bulkInsert = newPrices.map(
        dp =>
          ({
            contractId: 1,
            periodStart: dp.startTime,
            periodEnd: addHours(dp.startTime, 1),
            price: dp.price,
          }) as typeof schema.electricityPrice.$inferInsert,
      )
      if (bulkInsert.length > 0) {
        await this._conn.insert(schema.electricityPrice).values(bulkInsert)
      }
      return newPrices
    } catch (error) {
      console.log(error)
    }
  }
}

export interface DataPoint {
  st: string
  p: string
}
export interface TransformedDataPoint {
  startTime: Date
  price: number
}

export interface SpotResult {
  updated: string
  data: Array<DataPoint>
}
export class TransformedSpotResult {
  updated: Date
  data: Array<TransformedDataPoint>

  constructor(raw: SpotResult, timezone: string) {
    this.updated = utcToZonedTime(parseISO(raw.updated), timezone)

    this.data = raw.data.map(dp => {
      const st = utcToZonedTime(parseISO(dp.st), timezone)
      const now = new Date()
      return {
        price: parseFloat(dp.p),
        startTime: st,
        endTime: addHours(st, 1),
      } as TransformedDataPoint
    })
  }
}
