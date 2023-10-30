export interface PricePoint {
  price: number
  startTime: Date
  hrStart: string
}
export type PricePointWire = Omit<PricePoint, 'startTime' | 'col'> & { startTime: string }
