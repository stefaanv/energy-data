import { differenceInMinutes, isBefore } from 'date-fns'
import { Percentage } from 'src/helpers'

export interface BatteryConfig {
  /** in kWh */ capacity: number
  /** in Watt */ maxChargePower: number
  /** in Watt */ maxDischargePower: number
  /** in % */ lowerSocLimit: number
  /** in % */ upperSocLimit: number
}

export type ChargeMode = 'charge' | 'discharge'
export type PowerSettingType = 'absolute' | 'target'

export interface ChargeSetting {
  mode: ChargeMode
  from: Date
  till: Date
  power: number
  target?: number
  holdOff?: Percentage
}

export class ForciblyCharge {
  static config: BatteryConfig
  public readonly _power: number
  public readonly _target?: number
  private readonly _powerLimit: number

  constructor(private readonly _setting: ChargeSetting) {
    const config = ForciblyCharge.config
    this._target = !_setting.target
      ? undefined
      : Math.min(Math.max(_setting.target ?? 0, config.lowerSocLimit), config.upperSocLimit)
    this._powerLimit = _setting.mode === 'charge' ? config.maxChargePower : config.maxDischargePower
    this._power = Math.max(0, Math.min(_setting.power, this._powerLimit))

    const isBef = isBefore(_setting.from, _setting.till)
    if (!isBefore(_setting.from, _setting.till)) throw new Error('from must be before till')
  }

  get periodInMinutes() {
    return differenceInMinutes(this._setting.till, this._setting.from)
  }
  get periodInHours() {
    return this.periodInMinutes / 60.0
  }

  /**
   * @param currentSOC percentage (0-100) of
   */
  calcPower(currentSOC: number): number | undefined {
    const setting = this._setting
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
    const energy = socDifference * ForciblyCharge.config.capacity * 10
    const power = energy / this.periodInHours
    return setting.mode === 'charge'
      ? Math.min(power, this._powerLimit)
      : Math.max(power, -this._powerLimit)
  }

  get power() {
    return this._powerLimit
  }
  get target() {
    return this._target
  }
}
