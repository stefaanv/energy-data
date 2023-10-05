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

export class ForciblyCharge {
  static config: BatteryConfig

  constructor(
    public mode: ChargeMode,
    public readonly from: Date,
    public readonly till: Date,
    public readonly maxPower: number,
    public readonly target?: number,
    public readonly holdOff?: Percentage,
  ) {
    if (maxPower < 0) throw new Error('powerSetting must be positive')
    if (target && (target < 0 || target > 100))
      throw new Error('powerSetting must be between 0 and 100%')
    const isBef = isBefore(from, till)
    if (!isBefore(from, till)) throw new Error('from must be before till')
  }

  get periodInMinutes() {
    return differenceInMinutes(this.till, this.from)
  }
  get periodInHours() {
    return this.periodInMinutes / 60.0
  }

  /**
   * @param currentSOC percentage (0-100) of
   */
  calcPower(currentSOC: number): number | undefined {
    // Target gedefinieerd
    const target = Math.min(
      Math.max(this.target ?? 0, ForciblyCharge.config.lowerSocLimit),
      ForciblyCharge.config.upperSocLimit,
    )

    // Niets doen wanneer het target al overschreden is
    if (
      (this.mode === 'charge' && ((currentSOC > this.holdOff ?? 100) || currentSOC > target)) ||
      (this.mode === 'discharge' && ((currentSOC < this.holdOff ?? 0) || currentSOC < target))
    )
      return undefined

    const sign = this.mode === 'charge' ? +1 : -1
    const powerLimit =
      this.mode === 'charge'
        ? ForciblyCharge.config.maxChargePower
        : ForciblyCharge.config.maxDischargePower

    // Indien geen target dan laden met opgegeven max power
    if (!this.target) {
      return sign * Math.min(this.maxPower, powerLimit)
    }

    const socDifference = target - currentSOC
    const energy = socDifference * ForciblyCharge.config.capacity * 10
    const power = energy / this.periodInHours
    return this.mode === 'charge' ? Math.min(power, powerLimit) : Math.max(power, -powerLimit)
  }
}
