import { format, OptionsWithTZ } from 'date-fns-tz'

export const BatteryOperationModeValues = ['charge', 'discharge', 'optimize', 'disabled'] as const
export type BatteryOperationMode = (typeof BatteryOperationModeValues)[number]
export type Percentage = number
const TZO: OptionsWithTZ = { timeZone: 'Europe/Brussels' } //TODO nog uit config halen BE/FE
const TF = 'd/MM HH:mm'
const TFTO = 'd/MM HH:mm'

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
    format(task.from, TF, TZO) +
    ' -> ' +
    format(task.till, TFTO, TZO) +
    ' ' +
    task.mode +
    ` @ ${task.power} W`
  )
}
