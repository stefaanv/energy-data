import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import * as axios from 'axios'
import { BELPEX_CKEY, BELPEX_URL_CKEY, BELPEX_PARAMS_CKEY } from '../config-validator.joi'
import { LoggerService } from '../logger.service'
import { addHours, isBefore, parseISO, subHours } from 'date-fns'
import { format, utcToZonedTime } from 'date-fns-tz'
import { first, last, tryit } from 'radash'
import { EntityManager } from '@mikro-orm/core'
import { Index } from '../entities/index.entity'
import { IndexValue } from '../entities/index-value.entity'
import { Cron } from '@nestjs/schedule'
import { HR_DB_TIME_FORMAT, TZ_OPTIONS } from '../helpers/time.helpers'
import { round } from '../helpers/number.helper'
import { PricePoint } from '@src/shared-models/price-point.interface'

type GetParams = Record<string, string | number>
const SPOT_BELPEX_NAME = 'Spot Belpex'

@Injectable()
export class PricingService {
  private readonly _url: string
  private readonly _urlParams: GetParams
  private _timeZone: string
  private _spotBelpex: Index

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
    private readonly _em: EntityManager,
  ) {
    this._url = config.get([BELPEX_CKEY, BELPEX_URL_CKEY])
    this._urlParams = config.get<GetParams>([BELPEX_CKEY, BELPEX_PARAMS_CKEY])
    this._timeZone = config.get('timeZone')
    this.selectOrCreateBelpexIndex()
  }

  private async selectOrCreateBelpexIndex() {
    const em = this._em.fork()
    const values = await em.find(Index, { name: SPOT_BELPEX_NAME }, { orderBy: { id: 'asc' } })
    if (values.length === 0) {
      this._spotBelpex = em.create(Index, { name: SPOT_BELPEX_NAME })
      em.persistAndFlush(this._spotBelpex)
    } else {
      this._spotBelpex = values[0]
    }
  }

  @Cron('0 10 14-23/2 * * *')
  async loadIndexData() {
    this._log.log(`retreiving Spot belpex index, id = ${this._spotBelpex.id}`)
    const uri = axios.getUri({ url: this._url, params: this._urlParams })
    const [error1, aResult] = await tryit(axios.get<SpotResult>)(uri)
    if (error1) {
      this._log.error(`unable to get Belpex values`)
      console.error(error1)
      return
    }
    const spotPrices = new TransformSpotResults(aResult.data, this._timeZone)
    const em = this._em.fork()
    const [error2, lastRec] = await tryit(() => em.findOne(IndexValue, { index: this._spotBelpex }, { orderBy: { startTime: 'DESC' } }))()
    if (error2) {
      this._log.error(`unable to retreive index values`)
      console.error(error2)
      return
    }

    const lastKnowValueTime = lastRec ? lastRec.startTime : new Date(1970, 1)
    const newPrices = spotPrices.data.filter(dp => isBefore(lastKnowValueTime, dp.startTime))

    if (newPrices.length > 0) {
      for (const price of newPrices) {
        const result = await em.upsert(IndexValue, {
          startTime: price.startTime,
          hrTime: format(price.startTime, HR_DB_TIME_FORMAT, TZ_OPTIONS),
          endTime: addHours(price.startTime, 1),
          price: round(price.price, 3),
          index: this._spotBelpex,
        })
      }
      const [error3] = await tryit(() => em.flush())()
      if (error3) {
        this._log.error(`unable to store index values`)
        console.error(error3)
        return
      }

      const dFrom = format(first(spotPrices.data).startTime, 'dd/MM/yy HH:mm', TZ_OPTIONS)
      const dTill = format(last(spotPrices.data).startTime, 'dd/MM/yy HH:mm', TZ_OPTIONS)
      const msg = `Loaded Sport Epex data from ${dFrom} - ${dTill}, save ${newPrices.length} to DB`
      this._log.log(msg)
    }
  }

  public async getBelpexSince(since: Date = subHours(new Date(), 8)): Promise<PricePoint[]> {
    const [error, recs]: [Error, IndexValue[]] = await tryit(() => this._em.find(IndexValue, { index: this._spotBelpex, startTime: { $gt: since } }, { orderBy: { startTime: 'DESC' } }))()
    if (error) {
      this._log.error(`unable to retreive prices`)
      console.error(error)
      return
    }
    return recs.map(pp => ({ price: pp.price, startTime: pp.startTime, hrStart: pp.hrTime }))
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
export class TransformSpotResults {
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
