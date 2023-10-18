import { differenceInDays } from 'date-fns'
import { chargeTaskFromWire, relDate } from './charge-task.interface'
import { IChargeTaskWire, dateRel } from '../shared-models/charge-task.wire.interface'

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

describe('relDate function', () => {
  let now: Date

  beforeEach(() => {
    now = new Date(2023, 9, 18, 18, 28, 42)
  })
  it('1', () => {
    const refDate = new Date('2023-10-18T16:13:52.096Z') // 18:13
    expect(relDate(refDate, now)).toBeCloseTo(0)
  })
  it('2', () => {
    const refDate = new Date('2023-10-17T23:13:52.096Z') // 01:13
    expect(relDate(refDate, now)).toBeCloseTo(0)
  })
  it('3', () => {
    const refDate = new Date('2023-10-18T21:13:52.096Z') // 23:13
    expect(relDate(refDate, now)).toBeCloseTo(0)
  })
  it('4', () => {
    const refDate = new Date(2023, 9, 19, 0, 0, 0) // 23:13
    expect(relDate(refDate, now)).toBeCloseTo(1)
  })
  it('5', () => {
    now = new Date(2023, 9, 18, 0, 0, 0)
    const refDate = new Date(2023, 9, 19, 0, 0, 0) // 23:13
    expect(relDate(refDate, now)).toBeCloseTo(1)
  })
})

describe('FrontEnd Interface', () => {
  it('1', () => {
    const now = new Date('2023-10-18T16:13:52.096Z') // 18:13
    expect(dateRel(1, '10', '30', now).toLocaleString()).toBe('19/10/2023 10:30:00')
  })
  it('2', () => {
    const now = new Date(2023, 9, 18, 0, 0, 0)
    expect(dateRel(0, '03', '00', now).toLocaleString()).toBe('18/10/2023 03:00:00')
  })
  it('3', () => {
    const now = new Date(2023, 9, 18, 23, 59, 0)
    expect(dateRel(1, '03', '00', now).toLocaleString()).toBe('19/10/2023 03:00:00')
  })
  it('3', () => {
    const now = new Date(2023, 9, 18, 23, 59, 0)
    expect(dateRel(0, '01', '00', now).toLocaleString()).toBe('18/10/2023 01:00:00')
  })
})
