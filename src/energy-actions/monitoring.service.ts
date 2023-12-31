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
import { ConsProd, EnergyData } from '@src/home-assistant/energy-data.model'

const PROD_KEY = 'energy.production'
const CONS_KEY = 'energy.consumption'

export interface BatteryOperationStatus {
  workingMode: BatteryOperationMode
  setPower: number
  /** in minutes*/
  duration: number
}

export interface LocalEnergyData extends EnergyData {
  inQuarter: ConsProd
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
  private _hourlyTotals: ConsProd

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
    this._hourlyTotals = { consumption: 0, production: 0 }
  }

  @Cron('*/20 * * * * *')
  async monitor() {
    //TODO: guard against ERROR [Scheduler] LockWaitTimeoutException: select `c0`.* from `charge-tasks` as `c0` where `c0`.`from` > 1699163860062 order by `c0`.`from` asc - SQLITE_BUSY: database is locked
    const current = await this.getCurrentEnergyData()
    if (!current) {
      this._log.error(`undefined returned by MonitorService.getCurrentEnergyData()`)
      return
    }
    const now = current.time
    if (now.getMinutes() % 15 === 0 && (now.getSeconds() < 2 || now.getSeconds() > 58)) {
      this.everyQuarter(current, now.getMinutes() === 0)
    }

    this._lastEnergyData = current

    const allTasks = await this._energyService.allTasks()
    const actualTasks = allTasks.filter(t => isBetween(now, t.from, t.till))

    if (actualTasks.length === 0) {
      if (this._currentStatus.workingMode !== 'optimize') {
        await this._haCommService.stopForciblyCharge()
        this.setStatus('optimize', 0, 0)
        this._log.warn(`Stop forcibly charge`)
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
          const fromF = format(t.from, 'd/MM HH:mm', TZ_OPTIONS)
          const tillF = format(t.from, 'HH:mm', TZ_OPTIONS)
          const msg =
            `Start forcibly charge ${this._currentStatus.workingMode} @ ${power} for ${duration} min` +
            `for task ${fromF} - ${tillF} ${t.mode}`
          this._log.warn(msg)
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

  async everyQuarter(current: LocalEnergyData, onTheHour: boolean) {
    //TODO verbuiken maar om het uur rapporteren
    const now = new Date()

    if (this._startQuarterValues) {
      this._hourlyTotals.consumption += current.inQuarter.consumption
      this._hourlyTotals.production += current.inQuarter.production
      if (onTheHour) {
        this.report(this._hourlyTotals)
        this._hourlyTotals = { consumption: 0, production: 0 }
      }

      // Check for peak increase
      current.energy.monthlyPeak = this._monthlyPeakConsumption
      const consumption = current.inQuarter.consumption
      if (consumption > this._monthlyPeakConsumption) {
        this._monthlyPeakConsumption = consumption
        this._log.warn(`monthly peak increased to ${consumption}`)
      }

      await this.persist(current, now)
    } else {
      this._log.log(`getting initial quarter data`)
    }
    this._startQuarterValues = current
  }

  private async persist(current: LocalEnergyData, now: Date) {
    const em = this._em.fork()
    const [error] = await tryit(() =>
      em.insert(QuarterlyEntity, {
        batterySoc: round(current.battery.soc) ?? -1,
        gridConsumed: round(current.inQuarter.consumption) ?? -1,
        gridProduced: round(current.inQuarter.production) ?? -1,
        monthlyPeak: round(this._monthlyPeakConsumption) ?? -1,
        startTime: now,
        hrTime: format(now, HR_DB_TIME_FORMAT, TZ_OPTIONS),
      }),
    )()
    if (error) {
      this._log.error(`Error @ monitoring.service ln 159: ` + error.message)
      console.error(error)
      console.log('current=', current)
    }
  }

  private report(totals: ConsProd) {
    const statusMsg: Record<BatteryOperationMode, string> = {
      charge: `charging at ${this._currentStatus.setPower} W for ${this._currentStatus.duration} min`,
      discharge: `discharging at ${this._currentStatus.setPower} W for ${this._currentStatus.duration} min`,
      optimize: `optimizing`,
      disabled: `battery disabled`,
    }
    this._log.log(
      `cons +${totals.consumption}-${totals.production}Wh ${statusMsg} bat ${this.currentEnergyData.battery.soc}%`,
    )
  }

  async getCurrentEnergyData(): Promise<LocalEnergyData | undefined> {
    const time = new Date()
    const allData = await this._haCommService.getEnergyData()
    if (!allData) {
      return undefined
    }
    const prodDiff = get<number>(allData, PROD_KEY) - get<number>(this._startQuarterValues, PROD_KEY)
    const consDiff = get<number>(allData, CONS_KEY) - get<number>(this._startQuarterValues, CONS_KEY)
    const inQuarter = {
      production: round(1000 * prodDiff, 0) ?? -1,
      consumption: round(1000 * consDiff, 0) ?? -1,
    }
    // console.log(`productionInQuarter`, productionInQuarter, `consumptionInQuarter`, consumptionInQuarter)

    return {
      ...allData,
      inQuarter,
    }
  }

  @Cron('0 0 0 1 * *')
  async resetMonthlyValues() {
    this._monthlyPeakConsumption = 0
  }
}
