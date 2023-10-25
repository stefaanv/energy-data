import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { LoggerService } from 'src/logger.service'
import { EnergyService } from './energy.service'
import { IChargeTask, chargeTaskSettingToString } from '../shared-models/charge-task.interface'
import { ChargeTask } from './charge-task.class'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'

@Injectable()
export class MonitorService {
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
  }

  async monitor() {
    const now = new Date()
    const taskList = await this._energyService.allTasks(now)

    for (const t of taskList) {
      const task = new ChargeTask(t)
      if (task.isWithinPeriod(now) && !task.commandSent) {
        const duration = task.periodInMinutes()
        const sign = task.setting.mode === 'charge' ? 1 : -1
        this._haCommService.startForcibly(sign * task._power, duration)
        task.commandSent = true
      }
    }
  }
}
