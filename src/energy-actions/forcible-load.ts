import { differenceInMinutes, isBefore } from 'date-fns'
import { Percentage } from 'src/helpers'

export interface BatteryConfig {
  /** in kWh */ capacity: number
  /** in Watt */ maxChargePower: number
  /** in Watt */ maxDischargePower: number
}

export type ChargeMode = 'charge' | 'discharge'
export type PowerSettingType = 'absolute' | 'target'

export class ForciblyCharge {
  private _power?: number = undefined
  private _target?: Percentage = undefined
  static config: BatteryConfig

  constructor(
    public mode: ChargeMode,
    powerSetting: number,
    public readonly from: Date,
    public readonly till: Date,
    powerSettingType: PowerSettingType = 'absolute',
    public holdOffPercentage?: Percentage,
  ) {
    if (powerSettingType == 'absolute' && powerSetting < 0)
      throw new Error('powerSetting must be positive')
    if (powerSettingType == 'target' && (powerSetting < 0 || powerSetting > 100))
      throw new Error('powerSetting must be between 0 and 100%')
    const isBef = isBefore(from, till)
    if (!isBefore(from, till)) throw new Error('from must be before till')

    if (powerSettingType === 'absolute') {
      const sign = this.mode === 'charge' ? +1 : -1
      this._power = powerSetting * sign
    } else {
      this._target = powerSetting
    }
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
    // Niets doen wanneer het target al overschreden is
    if (
      (this.mode === 'charge' &&
        ((currentSOC > this.holdOffPercentage ?? 0) || (currentSOC > this.target ?? 0))) ||
      (this.mode === 'discharge' &&
        ((currentSOC < this.holdOffPercentage ?? 100) || (currentSOC < this.target ?? 100)))
    )
      return undefined

    const sign = this.mode === 'charge' ? +1 : -1
    // Indien absoluut gedefinieerd, dan enkel teken toevoegen
    if (this.power) {
      return sign * this.power
    }

    // Target gedefinieerd
    const socDifference = this.target - currentSOC
    const energy = socDifference * ForciblyCharge.config.capacity * 10
    return energy / this.periodInHours
  }

  /** in % */
  get target(): Percentage | undefined {
    return this._target
  }

  /** in Watt */
  get power(): number | undefined {
    return this._power
  }
}
