import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { BatteryConfig, ChargeTaskSetting, ChargeTask } from './energy-actions/forcibly-charge'
import { zonedTimeToUtc } from 'date-fns-tz'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'

@Injectable()
export class BatteryMonitorService {
  private _timeZone: string
  private _taskList: Array<ChargeTask>

  constructor(
    private readonly _config: ConfigService,
    private _schedulerRegistry: SchedulerRegistry,
    private readonly _commService: HomeAssistantCommuncationService,
  ) {
    ChargeTask.config = _config.get<BatteryConfig>('batteryConfig')
    this._timeZone = _config.get('timeZone')
    const schedulerPeriodMs = 1000 * _config.get<number>('batteryMonitorInterval')
    const schedulerInterval = setInterval(() => this.monitor(), schedulerPeriodMs)
    this._schedulerRegistry.addInterval('monitorInterval', schedulerInterval)
    this.loadTaskListFromConfig()
    _config.on('reloaded', () => this.loadTaskListFromConfig())
  }

  loadTaskListFromConfig() {
    console.log('reloading tasklist')
    this._taskList = this._config.get<Array<ChargeTaskSetting>>('taskList').map(task => {
      const from = zonedTimeToUtc(task.from, this._timeZone)
      const till = zonedTimeToUtc(task.till, this._timeZone)
      return new ChargeTask({ ...task, from, till })
    })
  }

  get tasks() {
    return this._taskList
  }

  monitor() {
    const now = new Date()
    // console.log(format(now, 'HH:mm:ss'))
    for (const fc of this._taskList) {
      if (fc.isWithinPeriod(now) && !fc.commandSent) {
        const duration = fc.periodInMinutes
        const sign = fc.setting.mode === 'charge' ? 1 : -1
        this._commService.startForcibly(sign * fc._power, duration)
        fc.commandSent = true
      }
    }
  }
}
