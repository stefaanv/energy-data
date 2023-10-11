import { Controller, Get, Inject, Param } from '@nestjs/common'
import { AppService } from './app.service'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'
import Database from 'better-sqlite3'
import { DRIZZLE_CONNECTION } from './drizzle/drizzle.module'
import * as schema from './drizzle/schema'
import { PricingService } from './pricing.service'

@Controller()
export class AppController {
  constructor(
    private readonly _appService: AppService,
    private readonly _haCommService: HomeAssistantCommuncationService,
    @Inject(DRIZZLE_CONNECTION) private readonly _conn: Database<typeof schema>,
    private readonly _pricingService: PricingService,
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
    type NewContract = typeof schema.contract.$inferInsert
    const testContract: NewContract = { name: 'Engie Dynamic' }
    await this._conn.insert(schema.contract).values(testContract)
    return 'New contract added'
  }

  @Get('db-select')
  async getDbTest() {
    return this._conn.select().from(schema.electricityPrice).all()
  }

  @Get('pricing')
  async getPricing() {
    return this._pricingService.loadCurrentPricingData()
  }
}
