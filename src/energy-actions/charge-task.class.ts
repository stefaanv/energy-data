import { differenceInMinutes, isBefore } from 'date-fns'
import { IChargeTask } from '../shared-models/charge-task.interface'
import { isDate } from 'radash'

export interface BatteryConfig {
  /** in kWh */ capacity: number
  /** in Watt */ maxChargePower: number
  /** in Watt */ maxDischargePower: number
  /** in % */ lowerSocLimit: number
  /** in % */ upperSocLimit: number
}

function isBetween(date: Date, from: Date, till: Date) {
  const result = isBefore(date, till) && isBefore(from, date)
  return result
}

export class ChargeTask {
  static config: BatteryConfig
  public readonly _power: number
  public readonly _target?: number
  private readonly _powerLimit: number
  public commandSent: boolean

  constructor(public setting: IChargeTask) {
    const config = ChargeTask.config
    this._target = !setting.target
      ? undefined
      : Math.min(Math.max(setting.target ?? 0, config.lowerSocLimit), config.upperSocLimit)
    this._powerLimit = setting.mode === 'charge' ? config.maxChargePower : config.maxDischargePower
    this._power = Math.max(0, Math.min(setting.power, this._powerLimit))
    this.commandSent = false

    if (setting.from >= setting.till) throw new Error('from must be before till')
  }

  periodInMinutes(now = new Date()) {
    const nowIsWithin = isBefore(this.setting.from, now) && isBefore(now, this.setting.till)
    const startTime = nowIsWithin ? now : this.setting.from
    return differenceInMinutes(this.setting.till, startTime)
  }

  periodInHours(now = new Date()) {
    return this.periodInMinutes(now) / 60.0
  }

  /**
   * @param currentSOC percentage (0-100) of
   */
  calcPower(currentSOC: number, now = new Date()): number | undefined {
    const setting = this.setting
    // Target gedefinieerd
    // Niets doen wanneer het target al overschreden is
    if (
      (setting.mode === 'charge' &&
        ((currentSOC > setting.holdOff ?? 100) || currentSOC > this._target)) ||
      (setting.mode === 'discharge' &&
        ((currentSOC < setting.holdOff ?? 0) || currentSOC < this._target))
    )
      return undefined

    const sign = setting.mode === 'charge' ? +1 : -1

    // Indien geen target dan laden met opgegeven max power
    if (!this._target) {
      return sign * Math.min(this._power, this._powerLimit)
    }

    const socDifference = this._target - currentSOC
    const energy = socDifference * ChargeTask.config.capacity * 10
    const power = energy / this.periodInHours(now)
    return setting.mode === 'charge'
      ? Math.min(power, this._powerLimit)
      : Math.max(power, -this._powerLimit)
  }

  isWithinPeriod(time: Date) {
    return isBetween(time, this.setting.from, this.setting.till)
  }

  get power() {
    return this._powerLimit
  }

  get target() {
    return
    return this._target
  }
}
