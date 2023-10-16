import { Controller, Get, Inject, Param } from '@nestjs/common'
import { AppService } from './app.service'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'
import { PricingService } from './pricing.service'
import { EntityManager } from '@mikro-orm/core'
import { subDays } from 'date-fns'
import { IndexValue } from './entities/index-value.entity'
import { format } from 'date-fns-tz'
import { BatteryMonitorService } from './battery-monitor.service'
import { ChargeTask } from './energy-actions/forcibly-charge'

@Controller()
export class AppController {
  constructor(
    private readonly _appService: AppService,
    private readonly _haCommService: HomeAssistantCommuncationService,
    private readonly _pricingService: PricingService,
    private readonly _batteryMonitorService: BatteryMonitorService,
    private readonly _em: EntityManager,
  ) {}

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

  @Get('tasks')
  getTasks() {
    return tasksAsTable(this._batteryMonitorService.tasks)
  }

  @Get('belpex')
  async getBelpex() {
    const twoDaysAgo = subDays(new Date(), 2)
    const json = await this._pricingService.getBelpexSince(twoDaysAgo)
    const ashtml = indexAsTable(json)
    return ashtml
  }

  @Get('pricing')
  async getPricing() {
    this._pricingService.loadIndexData()
    return 'OK'
  }
}

function indexAsTable(values: IndexValue[]) {
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

function tasksAsTable(tasks: ChargeTask[]) {
  return (
    '<h1>Tasks</h1><table><tr><th>start</th><th>einde</th><th>mode</th><th>vermogen</th></tr>' +
    tasks
      .map(t => {
        const fTime = format(t.setting.from, 'd/MM HH:mm', { timeZone: 'Europe/Brussels' })
        const tTime = format(t.setting.till, 'd/MM HH:mm', { timeZone: 'Europe/Brussels' })
        return `<tr><td>${fTime}</td><td>${tTime}</td><td>${t.setting.mode}</td><td>${t.setting.power}</td></tr>`
      })
      .join('') +
    '</table>'
  )
}
