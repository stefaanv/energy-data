import { Controller, Get, Inject, Param } from '@nestjs/common'
import { AppService } from './app.service'
import { HaCommService } from './energy-actions/ha-comms.service'
import { PricingService } from './pricing/pricing.service'
import { EntityManager } from '@mikro-orm/core'
import { subDays } from 'date-fns'
import { IndexValue } from './entities/index-value.entity'
import { format } from 'date-fns-tz'
import { EnergyTasksService } from './energy-actions/energy-tasks.service'
import { ChargeTask } from './energy-actions/charge-task.class'
import { TZ_OPTIONS } from './helpers/time.helpers'

@Controller()
export class AppController {
  constructor(
    private readonly _appService: AppService,
    private readonly _haCommService: HaCommService,
    private readonly _pricingService: PricingService,
    private readonly _energyService: EnergyTasksService,
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

  @Get('smart-meter')
  getSmartMeterData() {
    return this._haCommService.getEnergyData()
  }
}

function indexAsTable(values: IndexValue[]) {
  return (
    '<table><tr><th>startTime</th><th>value</th></tr>' +
    values
      .map(v => {
        const fTime = format(v.startTime, 'd/MM HH:mm', TZ_OPTIONS)
        return `<tr><td>${fTime}</td><td>${v.price}</td></tr>`
      })
      .join('') +
    '</table>'
  )
}

function tasksAsTable(tasks: ChargeTask[]) {
  return (
    '<h1>Tasks</h1>' +
    '<table><tr><th>dag</th><th>start</th><th>einde</th><th>mode</th><th>vermogen</th></tr>' +
    tasks
      .map(t => {
        return `<tr><td>${t.setting.from.toString()}</td><td>${t.setting.till.toString()}` + `</td><td>${t.setting.mode}</td><td>${t.setting.power}</td></tr>`
      })
      .join('') +
    '</table>'
  )
}
