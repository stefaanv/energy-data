import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { LoggerService } from '@src/logger.service'
import { EnergyService } from './energy.service'
import { BatteryOperationMode } from '../shared-models/charge-task.interface'
import { ChargeTask } from './charge-task.class'
import { EnergyData, HaCommService } from './ha-comms.service'
import { HR_DB_TIME_FORMAT, TZ_OPTIONS, isBetween } from '@src/helpers/time.helpers'
import { format } from 'date-fns-tz'
import { get, tryit } from 'radash'
import { EntityManager } from '@mikro-orm/sqlite'
import { QuarterlyEntity } from '@src/entities/quarterly'
import { round } from '@src/helpers/number.helper'

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
  private _currentBatOperationStatus: BatteryOperationStatus
  private _startQuarterValues: EnergyData
  private _monthlyPeakConsumption: number
  private _minMonthlyPeakConsumption: number

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
    schedulerRegistry: SchedulerRegistry,
    private readonly _energyService: EnergyService,
    private readonly _haCommService: HaCommService,
    private readonly _em: EntityManager,
  ) {
    const fastPeriodMs = 1000 * config.get<number>('monitorIntervalSec')
    const fastInterval = setInterval(() => this.monitor(), fastPeriodMs)
    schedulerRegistry.addInterval('monitorService.fastInterval', fastInterval)
    this._currentBatOperationStatus = START_STATUS
    this._minMonthlyPeakConsumption = config.get<number>('minMonthlyPeakWh')
    this._monthlyPeakConsumption = 0
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
        const curStat = this._currentBatOperationStatus
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

  @Cron('0 */15 * * * *')
  async everyQuarter() {
    const now = new Date()
    const current = await this._haCommService.getEnergyData()
    current.energy.monthlyPeak = this._monthlyPeakConsumption

    if (this._startQuarterValues) {
      const prodKey = 'energy.production'
      const production =
        1000 * (get<number>(current, prodKey) - get<number>(this._startQuarterValues, prodKey))
      const consKey = 'energy.consumption'
      const consumption =
        1000 * (get<number>(current, consKey) - get<number>(this._startQuarterValues, consKey))
      const time = format(now, 'HH:mm')
      const msg = `quarter info at ${time} : cons ${consumption}Wh, inj ${production}Wh`
      this._log.log(msg)
      if (consumption > this._monthlyPeakConsumption) {
        this._monthlyPeakConsumption = consumption
        this._log.warn(`monthly peak increaed to ${consumption}`)
      }
      const em = this._em.fork()
      const [error] = await tryit(() =>
        em.insert(QuarterlyEntity, {
          batterySoc: round(current.battery.soc),
          gridConsumed: round(consumption),
          gridProduced: round(production),
          monthlyPeak: round(this._monthlyPeakConsumption),
          startTime: now,
          hrTime: format(now, HR_DB_TIME_FORMAT, TZ_OPTIONS),
        }),
      )()
      if (error) this._log.error(`unable to save quarterly energy values: ${error.message}`)
    } else {
      this._log.log(`getting initial quarter data`)
    }
    this._startQuarterValues = current
  }

  @Cron('0 0 0 1 * *')
  async resetMonthlyValues() {
    this._monthlyPeakConsumption = 0
  }
}
