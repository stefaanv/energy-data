export interface ConsProd {
  consumption: number
  production: number
}

export interface EnergyData {
  time: Date
  power: ConsProd
  energy: ConsProd & { monthlyPeak?: number }
  battery: { soc: number; chargePower: number }
  inverter: { inputPower: number }
  grid: { power: number }
}
