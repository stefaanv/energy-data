import { OptionsWithTZ, format } from 'date-fns-tz'

export const BatteryOperationModeValues = ['charge', 'discharge', 'optimize', 'disabled'] as const
export type BatteryOperationMode = (typeof BatteryOperationModeValues)[number]
export type Percentage = number
const TF = 'd/MM HH:mm'
const TFTO = 'd/MM HH:mm'
const TZ_OPTIONS: OptionsWithTZ = { timeZone: 'Europe/Brussels' }

export interface IChargeTask {
  id: number
  mode: BatteryOperationMode
  from: Date
  till: Date
  power: number
  target?: number
  holdOff?: number
}

export function chargeTaskSettingToString(task: IChargeTask) {
  return (
    task.id +
    ': ' +
    format(task.from, TF, TZ_OPTIONS) +
    ' -> ' +
    format(task.till, TFTO, TZ_OPTIONS) +
    ' ' +
    task.mode +
    ` @ ${task.power} W`
  )
}
