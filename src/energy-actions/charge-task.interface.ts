export type ChargeMode = 'charge' | 'discharge'
export type Percentage = number

export interface IChargeTask {
  id: number
  mode: ChargeMode
  from: Date
  till: Date
  power: number
  target?: number
  holdOff?: number
}
