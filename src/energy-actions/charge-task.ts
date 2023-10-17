import { ChargeTask as ChargeTaskSetting } from '../shared-models/charge-task.model'
import { isDate } from 'radash'

export interface BatteryConfig {
  /** in kWh */ capacity: number
  /** in Watt */ maxChargePower: number
  /** in Watt */ maxDischargePower: number
  /** in % */ lowerSocLimit: number
  /** in % */ upperSocLimit: number
}

export class ChargeTask {
  static config: BatteryConfig
  public readonly _power: number
  public readonly _target?: number
  private readonly _powerLimit: number
  public commandSent: boolean

  constructor(public readonly setting: ChargeTaskSetting) {
    const config = ChargeTask.config
    this._target = !setting.target
      ? undefined
      : Math.min(Math.max(setting.target ?? 0, config.lowerSocLimit), config.upperSocLimit)
    this._powerLimit = setting.mode === 'charge' ? config.maxChargePower : config.maxDischargePower
    this._power = Math.max(0, Math.min(setting.power, this._powerLimit))
    this.commandSent = false

    if (setting.from >= setting.till) throw new Error('from must be before till')
  }

  get periodInMinutes() {
    const now = new Date()
    const timeNow = now.getHours() / 24 + now.getMinutes() / 24 / 60
    const startTime = this.isWithinPeriod(timeNow) ? timeNow : this.setting.from
    return (this.setting.till - startTime) * 60 * 24
  }

  get periodInHours() {
    return this.periodInMinutes / 60.0
  }

  /**
   * @param currentSOC percentage (0-100) of
   */
  calcPower(currentSOC: number): number | undefined {
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
    const power = energy / this.periodInHours
    return setting.mode === 'charge'
      ? Math.min(power, this._powerLimit)
      : Math.max(power, -this._powerLimit)
  }

  isWithinPeriod(time: Date | number) {
    const timePart = isDate(time) ? time.getHours() / 24 + time.getMinutes() / 24 / 60 : time
    return this.setting.from < timePart && timePart < this.setting.till
  }

  get power() {
    return this._powerLimit
  }

  get target() {
    return this._target
  }
}
