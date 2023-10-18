import { differenceInDays } from 'date-fns'
import { IChargeTaskWire, chargeTaskFromWire } from './charge-task.interface'

describe('convert charge task from wire', () => {
  let fromWire: IChargeTaskWire

  beforeEach(() => {
    fromWire = {
      id: 1,
      mode: 'charge',
      power: 2000,
      from: '2023-10-17T22:30:00.000Z', // 0h30
      till: '2023-10-18T16:00:00.000Z', // 18h
    }
  })

  it('1', () => {
    const task = chargeTaskFromWire(fromWire)
    expect(task.id).toBeCloseTo(1)
    expect(task.mode).toBe('charge')
    expect(task.power).toBeCloseTo(2000)
    expect(task.from.toLocaleTimeString()).toBe('00:30:00')
    expect(task.till.toLocaleTimeString()).toBe('18:00:00')
    expect(differenceInDays(task.from, task.till)).toBeCloseTo(0)
  })
})
