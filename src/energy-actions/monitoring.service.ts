import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { LoggerService } from 'src/logger.service'
import { EnergyService } from './energy.service'
import { BatteryOperationMode } from '../shared-models/charge-task.interface'
import { ChargeTask } from './charge-task.class'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'
import { isBetween } from 'src/helpers/time.helpers'
import { format } from 'date-fns-tz'

export interface BatteryOperationStatus {
  workingMode: BatteryOperationMode
  setPower: number
  /** in minutes*/
  duration: number
}

const START_STATUS = {
  duration: 0,
  setPower: 0,
  workingMode: 'optimize',
} as BatteryOperationStatus

function isCloseTo(a: number, b: number, divergence = 0.01) {
  const difference = Math.abs(b - a)
  const absValue = Math.abs(b)
  const pctDiff = difference / absValue
  return pctDiff < divergence
}

@Injectable()
export class MonitorService {
  private _currentStatus: BatteryOperationStatus

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
    schedulerRegistry: SchedulerRegistry,
    private readonly _energyService: EnergyService,
    private readonly _haCommService: HomeAssistantCommuncationService,
  ) {
    const schedulerPeriodMs = 1000 * config.get<number>('monitorIntervalSec')
    const schedulerInterval = setInterval(() => this.monitor(), schedulerPeriodMs)
    schedulerRegistry.addInterval('monitorService.monitorInterval', schedulerInterval)
    this._currentStatus = START_STATUS
  }

  async monitor() {
    const now = new Date()
    const actualTasks = (await this._energyService.allTasks(now)).filter(t =>
      isBetween(now, t.from, t.till),
    )

    for (const t of actualTasks) {
      const task = new ChargeTask(t)
      if (task.isWithinPeriod(now)) {
        const duration = task.periodInMinutes()
        const power = (task.setting.mode === 'charge' ? 1 : -1) * task._power
        const curStat = this._currentStatus
        if (!isCloseTo(power, curStat.setPower) || curStat.workingMode !== task.setting.mode) {
          this._haCommService.startForcibly(power, duration)
          curStat.setPower = power
          curStat.workingMode = task.setting.mode
          curStat.duration = duration
          const date = format(now, 'd/MM HH:mm')
          const msg = `Started ${power}W forcibly ${task.setting.mode} for ${duration} minutes at ${date}`
          this._log.log(msg)
        }
        task.commandSent = true
      }
    }
  }
}
