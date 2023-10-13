import { Controller, Get, Inject, Param } from '@nestjs/common'
import { AppService } from './app.service'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'
import { PricingService } from './pricing.service'
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/core'
import { Index } from './entities/index.entity'
import { subDays } from 'date-fns'
import { IndexValue } from './entities/index-value.entity'
import { format } from 'date-fns-tz'

@Controller()
export class AppController {
  constructor(
    private readonly _appService: AppService,
    private readonly _haCommService: HomeAssistantCommuncationService,
    private readonly _pricingService: PricingService,
    private readonly _em: EntityManager,
  ) {}

  @Get()
  getHello(): string {
    return this._appService.getHello()
  }

  @Get('start')
  start(): string {
    this._haCommService.startForcibly(4500, 10)
    return 'forcibly charge started'
  }

  @Get('stop')
  stop(): string {
    this._haCommService.stopForciblyCharge()
    return 'forcibly charge stopped'
  }

  @Get('charge/:power/:duration')
  charge(@Param('power') power: number, @Param('duration') duration: number): string {
    this._haCommService.startForcibly(power, duration)
    return `Forcibly charge ${power} Watt for ${duration} minutes`
  }

  @Get('discharge/:power/:duration')
  discharge(@Param('power') power: number, @Param('duration') duration: number): string {
    this._haCommService.startForcibly(-power, duration)
    return `Forcibly discharge ${power} Watt for ${duration} minutes`
  }

  @Get('config')
  getConfig() {
    return this._appService.getConfig()
  }

  @Get('belpex')
  async getBelpex() {
    const twoDaysAgo = subDays(new Date(), 2)
    const json = await this._pricingService.getBelpexSince(twoDaysAgo)
    const ashtml = asTable(json)
    return ashtml
  }

  @Get('pricing')
  async getPricing() {
    this._pricingService.loadIndexData()
    return 'OK'
  }
}

function asTable(values: IndexValue[]) {
  return (
    '<table><tr><th>startTime</th><th>value</th></tr>' +
    values
      .map(v => {
        const fTime = format(v.startTime, 'd/MM HH:mm', { timeZone: 'Europe/Brussels' })
        return `<tr><td>${fTime}</td><td>${v.price}</td></tr>`
      })
      .join('') +
    '</table>'
  )
}
