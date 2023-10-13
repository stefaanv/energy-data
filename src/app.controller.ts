import { Controller, Get, Inject, Param } from '@nestjs/common'
import { AppService } from './app.service'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'
import { PricingService } from './pricing.service'
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/core'
import { InjectRepository } from '@mikro-orm/nestjs'
import { Index } from './entities/index.entity'

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

  @Get('db-insert')
  async getDbAdd() {
    const newIndex = this._em.create(Index, { name: 'Spot Belpex' })
    this._em.persist(newIndex)
    return 'New contract added'
  }

  @Get('db-select')
  async getDbTest() {
    const indices = await this._em.find(Index, {})
    return indices
  }

  // @Get('pricing')
  // async getPricing() {
  //   return this._pricingService.loadIndexData()
  // }
}
