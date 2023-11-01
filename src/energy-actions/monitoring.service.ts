import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { LoggerService } from '@src/logger.service'
import { EnergyTasksService } from './energy-tasks.service'
import { BatteryOperationMode } from '../shared-models/charge-task.interface'
import { ChargeTask } from './charge-task.class'
import { HaCommService } from '../home-assistant/ha-comms.service'
import { HR_DB_TIME_FORMAT, TZ_OPTIONS, isBetween } from '@src/helpers/time.helpers'
import { format } from 'date-fns-tz'
import { get, tryit } from 'radash'
import { EntityManager } from '@mikro-orm/sqlite'
import { QuarterlyEntity } from '@src/entities/quarterly'
import { round } from '@src/helpers/number.helper'
import { EnergyData } from '@src/home-assistant/energy-data.model'

const PROD_KEY = 'energy.production'
const CONS_KEY = 'energy.consumption'

export interface BatteryOperationStatus {
  workingMode: BatteryOperationMode
  setPower: number
  /** in minutes*/
  duration: number
}

export interface LocalEnergyData {
  time: Date
  allData?: EnergyData
  productionInQuarter: number
  consumptionInQuarter: number
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
  private _startQuarterValues: EnergyData
  private _monthlyPeakConsumption: number
  private _lastEnergyData: LocalEnergyData
  private _minMonthlyPeakConsumption: number

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
    private readonly _energyService: EnergyTasksService,
    private readonly _haCommService: HaCommService,
    private readonly _em: EntityManager,
  ) {
    this._currentStatus = START_STATUS
    this._minMonthlyPeakConsumption = config.get<number>('minMonthlyPeakWh')
    this._monthlyPeakConsumption = 0
  }

  @Cron('*/20 * * * * *')
  async monitor() {
    const current = await this.getCurrentEnergyData()
    if (!current) {
      this._log.error(`undefined returned by MonitorService.getCurrentEnergyData()`)
      return
    }
    this._lastEnergyData = current
    const now = current.time
    if (now.getMinutes() % 15 === 0 && (now.getSeconds() < 2 || now.getSeconds() > 58)) {
      this.everyQuarter(current)
    }

    const allTasks = await this._energyService.allTasks()
    const actualTasks = allTasks.filter(t => isBetween(now, t.from, t.till))
    if (actualTasks.length === 0) {
      if (this._currentStatus.workingMode !== 'optimize') {
        await this._haCommService.stopForciblyCharge()
        this.setStatus('optimize', 0, 0)
      }
      return // no tasks to execute
    }

    // some tasks to execute
    for (const t of actualTasks) {
      const task = new ChargeTask(t)
      if (task.isWithinPeriod(now)) {
        const duration = task.periodInMinutes()
        const power = (task.setting.mode === 'charge' ? 1 : -1) * task._power
        if (
          !isCloseTo(power, this._currentStatus.setPower) ||
          this._currentStatus.workingMode !== task.setting.mode
        ) {
          await this._haCommService.startForcibly(power, duration)
          this.setStatus(task.setting.mode, power, duration)
        }
      }
    }
  }

  setStatus(mode: BatteryOperationMode, power: number, duration: number) {
    this._currentStatus.setPower = power
    this._currentStatus.workingMode = mode
    this._currentStatus.duration = duration
  }

  get status() {
    return this._currentStatus
  }

  get currentEnergyData() {
    return this._lastEnergyData
  }

  async everyQuarter(current: LocalEnergyData) {
    const now = new Date()
    const peak = (current.allData.energy.monthlyPeak = this._monthlyPeakConsumption)
    const consumption = current.consumptionInQuarter
    const production = current.productionInQuarter

    if (this._startQuarterValues) {
      const timeF = format(now, 'HH:mm')
      this._log.log(`quarter info at ${timeF} : cons ${consumption}Wh, inj ${production}Wh`)
      if (consumption > this._monthlyPeakConsumption) {
        this._monthlyPeakConsumption = consumption
        this._log.warn(`monthly peak increased to ${consumption}`)
      }
      const em = this._em.fork()
      const [error] = await tryit(() =>
        em.insert(QuarterlyEntity, {
          batterySoc: round(current.allData.battery.soc) ?? -1,
          gridConsumed: round(consumption) ?? -1,
          gridProduced: round(production) ?? -1,
          monthlyPeak: round(this._monthlyPeakConsumption) ?? -1,
          startTime: now,
          hrTime: format(now, HR_DB_TIME_FORMAT, TZ_OPTIONS),
        }),
      )()
      if (error) this._log.error(`unable to save quarterly energy values: ${error.message}`)
    } else {
      this._log.log(`getting initial quarter data`)
    }
    this._startQuarterValues = current.allData
  }

  async getCurrentEnergyData(): Promise<LocalEnergyData | undefined> {
    const time = new Date()
    const allData = await this._haCommService.getEnergyData()
    if (!allData) return undefined
    const prodDiff = get<number>(allData, PROD_KEY) - get<number>(this._startQuarterValues, PROD_KEY)
    const productionInQuarter = round(1000 * prodDiff, 0) ?? -1
    const consDiff = get<number>(allData, CONS_KEY) - get<number>(this._startQuarterValues, CONS_KEY)
    const consumptionInQuarter = round(1000 * consDiff, 0) ?? -1
    // console.log(`productionInQuarter`, productionInQuarter, `consumptionInQuarter`, consumptionInQuarter)

    return {
      time,
      allData,
      productionInQuarter,
      consumptionInQuarter,
    }
  }

  @Cron('0 0 0 1 * *')
  async resetMonthlyValues() {
    this._monthlyPeakConsumption = 0
  }
}
