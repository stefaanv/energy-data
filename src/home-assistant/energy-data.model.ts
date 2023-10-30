export interface EnergyData {
  time: Date
  power: { consumption: number; production: number }
  energy: { consumption: number; production: number; monthlyPeak?: number }
  battery: { soc: number; chargePower: number }
  inverter: { inputPower: number }
  grid: { power: number }
}
