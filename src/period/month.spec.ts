import { subSeconds, addSeconds, getYear, getMonth } from 'date-fns'
import { Month } from './month'

describe('Month tests', () => {
  it('label must be well-formed', () => {
    expect(Month.isValidLabel('abc')).toBeFalsy()
    expect(Month.isValidLabel('123-123')).toBeFalsy()
    expect(Month.isValidLabel('abcd-ab')).toBeFalsy()
    expect(Month.isValidLabel('2023-13')).toBeFalsy()
    expect(Month.isValidLabel('2023-10')).toBeTruthy()
    expect(Month.isValidLabel('23-10')).toBeTruthy()
  })

  it('month must be numeric between 1 and 12', () => {
    expect(Month.isValidLabel('2023-ab')).toBeFalsy()
    expect(Month.isValidLabel('2023-00')).toBeFalsy()
    expect(Month.isValidLabel('2023-99')).toBeFalsy()
    expect(Month.isValidLabel('2023-012')).toBeFalsy()
    expect(Month.isValidLabel('2023-12')).toBeTruthy()
  })

  it('label', () => {
    const month = new Month(2020, 12)
    expect(month.label).toBe('2020-12')
  })

  it('numeric creation', () => {
    expect(() => new Month(2020, 13)).toThrow()
    expect(() => new Month(2020, -13)).toThrow()
    expect(() => new Month(12020, 7)).toThrow()
    expect(() => new Month(-10, 2)).toThrow()
    expect(() => new Month(2020, 2)).not.toThrow()
  })

  it('from oktober', () => {
    const month = new Month(2020, 10)
    const fromMin = subSeconds(month.from, 1)
    expect(getMonth(fromMin) + 1).toBe(9)
    expect(getYear(fromMin)).toBe(2020)
    const fromPlus = addSeconds(month.from, 1)
    expect(getMonth(fromPlus) + 1).toBe(10)
    expect(getYear(fromPlus)).toBe(2020)
  })

  it('from january', () => {
    const month = new Month(2020, 1)
    const fromMin = subSeconds(month.from, 1)
    expect(getMonth(fromMin) + 1).toBe(12)
    expect(getYear(fromMin)).toBe(2019)
    const fromPlus = addSeconds(month.from, 1)
    expect(getMonth(fromPlus) + 1).toBe(1)
    expect(getYear(fromPlus)).toBe(2020)
  })

  it('till oktober', () => {
    const month = new Month(2020, 10)
    const tillMin = subSeconds(month.till, 1)
    expect(getMonth(tillMin) + 1).toBe(10)
    expect(getYear(tillMin)).toBe(2020)
    const tillPlus = addSeconds(month.till, 1)
    expect(getMonth(tillPlus) + 1).toBe(11)
    expect(getYear(tillPlus)).toBe(2020)
  })

  it('till december', () => {
    const month = new Month(2020, 12)
    const tillMin = subSeconds(month.till, 1)
    expect(getMonth(tillMin) + 1).toBe(12)
    expect(getYear(tillMin)).toBe(2020)
    const tillPlus = addSeconds(month.till, 1)
    expect(getMonth(tillPlus) + 1).toBe(1)
    expect(getYear(tillPlus)).toBe(2021)
  })
})
