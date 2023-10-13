import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import * as axios from 'axios'
import { BELPEX_CKEY, BELPEX_URL_CKEY, BELPEX_PARAMS_CKEY } from './config-validator.joi'
import { LoggerService } from './logger.service'
import { addHours, isBefore, parseISO } from 'date-fns'
import { format, utcToZonedTime } from 'date-fns-tz'
import { first, last } from 'radash'
import { EntityManager } from '@mikro-orm/core'
import { Index } from './entities/index.entity'
import { IndexValue } from './entities/index-value.entity'

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

  async loadIndexData() {
    console.log(`Spot belpex id`, this._spotBelpex.id)

    const indexValues = []
    try {
      const uri = axios.getUri({ url: this._url, params: this._urlParams })
      const aResult = await axios.get<SpotResult>(uri)
      const spotPrices = new TransformedSpotResult(aResult.data, this._timeZone)
      const lastValue = await this._em.findOne(
        IndexValue,
        { index: this._spotBelpex },
        { orderBy: { startTime: 'DESC' } },
      )
      const lastKnowValueTime = lastValue ? lastValue.startTime : new Date(1970, 1)
      const newPrices = spotPrices.data.filter(dp => isBefore(lastKnowValueTime, dp.startTime))

      if (newPrices.length > 0) {
        this._em.insertMany(
          IndexValue,
          newPrices.map(p => ({
            startTime: p.startTime,
            endTime: addHours(p.startTime, 1),
            price: p.price,
            index: this._spotBelpex,
          })),
        )
        await this._em.flush()
        const tzOptions = { timeZone: 'Europe/Brussels' }
        const dFrom = format(first(spotPrices.data).startTime, 'dd/MM/yy HH:mm', tzOptions)
        const dTill = format(last(spotPrices.data).startTime, 'dd/MM/yy HH:mm', tzOptions)
        console.log(`Loaded Sport Epex data from ${dFrom} - ${dTill}`)
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async getBelpexSince(date: Date) {
    const allBelpex = this._em.find(IndexValue, {
      /*startTime: { $lt: date }*/
    })
    return allBelpex
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
