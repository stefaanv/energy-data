import { subSeconds, addSeconds, getYear } from 'date-fns'
import { Year } from './year'

describe('Year tests', () => {
  it('label must be numeric', () => {
    expect(Year.isValidLabel('abc')).toBeFalsy()
  })

  it('label must be numeric', () => {
    expect(Year.isValidLabel('2')).toBeTruthy()
  })

  it('numeric label max 4 chars', () => {
    expect(Year.isValidLabel('12345')).toBeFalsy()
  })

  it('label', () => {
    const year = new Year(2020)
    expect(year.label).toBe('2020')
  })

  it('from', () => {
    const year = new Year(2020)
    expect(getYear(subSeconds(year.from, 1))).toBe(2019)
    expect(getYear(addSeconds(year.from, 1))).toBe(2020)
  })

  it('till', () => {
    const year = new Year(2020)
    expect(getYear(subSeconds(year.till, 1))).toBe(2020)
    expect(getYear(addSeconds(year.till, 1))).toBe(2021)
  })
})
