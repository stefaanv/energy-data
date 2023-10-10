import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { BatteryConfig, ChargeSetting, ForciblyCharge } from './energy-actions/forcibly-charge'
import { zonedTimeToUtc } from 'date-fns-tz'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'

@Injectable()
export class BatteryMonitorService {
  private _timeZone: string
  private _taskList: Array<ForciblyCharge>

  constructor(
    private readonly _config: ConfigService,
    private _schedulerRegistry: SchedulerRegistry,
    private readonly _commService: HomeAssistantCommuncationService,
  ) {
    ForciblyCharge.config = _config.get<BatteryConfig>('batteryConfig')
    this._timeZone = _config.get('timeZone')
    const schedulerPeriodMs = 1000 * _config.get<number>('batteryMonitorInterval')
    const schedulerInterval = setInterval(() => this.monitor(), schedulerPeriodMs)
    this._schedulerRegistry.addInterval('monitorInterval', schedulerInterval)
    this.loadTaskListFromConfig()
    _config.on('reloaded', () => this.loadTaskListFromConfig())
  }

  loadTaskListFromConfig() {
    console.log('reloading tasklist')
    this._taskList = this._config.get<Array<ChargeSetting>>('taskList').map(task => {
      const from = zonedTimeToUtc(task.from, this._timeZone)
      const till = zonedTimeToUtc(task.till, this._timeZone)
      return new ForciblyCharge({ ...task, from, till })
    })
  }

  monitor() {
    const now = new Date()
    // console.log(format(now, 'HH:mm:ss'))
    for (const fc of this._taskList) {
      if (fc.isWithinPeriod(now) && !fc.commandSent) {
        const duration = fc.periodInMinutes
        console.log(
          `Starting ${Math.abs(fc._power)}W forcibly ${fc._power > 0 ? '' : 'dis'}` +
            `charge for ${fc.periodInMinutes} minutes`,
        )
        this._commService.startForcibly(fc._power, duration)
        fc.commandSent = true
      }
    }
  }
}