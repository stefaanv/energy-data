import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { BatteryConfig, ChargeSetting, ForciblyCharge } from './energy-actions/forcibly-load'
import { zonedTimeToUtc } from 'date-fns-tz'

@Injectable()
export class BatteryMonitorService {
  private _taskListProxy: () => Array<ChargeSetting>
  private _timeZone: string

  constructor(
    config: ConfigService,
    private _schedulerRegistry: SchedulerRegistry,
  ) {
    ForciblyCharge.config = config.get<BatteryConfig>('batteryConfig')
    this._timeZone = config.get('timeZone')
    this._taskListProxy = config.createProxy<Array<ChargeSetting>>('taskList')
    const interval = 1000 * config.get<number>('batteryMonitorInterval')
    this._schedulerRegistry.addInterval('monitorInterval', interval)
    setTimeout(() => this.monitor(), 1000)
  }

  get taskList(): Array<ForciblyCharge> {
    return this._taskListProxy().map(task => {
      const from = zonedTimeToUtc(task.from, this._timeZone)
      const till = zonedTimeToUtc(task.till, this._timeZone)
      return new ForciblyCharge({ ...task, from, till })
    })
  }

  monitor() {
    const now = new Date()
    for (const fc of this.taskList) {
      if (fc.isWithinPeriod(now)) console.log(`nu is in period !!!`)
      else console.log(`nu is BUITEN period !!!`)
    }
  }
}
