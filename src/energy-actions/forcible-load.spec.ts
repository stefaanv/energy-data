import { BatteryConfig, ForciblyCharge } from './forcible-load'
import { parse } from 'date-fns'

describe('forcibly charge tests - absolute power', () => {
  let fCharge: ForciblyCharge
  let from: Date
  let till: Date
  beforeEach(() => {
    ForciblyCharge.config = {
      capacity: 10,
      maxChargePower: 5000,
      maxDischargePower: 5000,
    }
    from = parse('10:30', 'HH:mm', new Date())
    till = parse('11:00', 'HH:mm', new Date())
    fCharge = new ForciblyCharge('charge', 1200, from, till, 'absolute')
  })

  describe('illegal construction parameters must throw', () => {
    it('negative absolute power', () => {
      expect(() => new ForciblyCharge('charge', -1200, from, till, 'absolute')).toThrow()
    })
    it('positive absolute power is OK', () => {
      expect(() => new ForciblyCharge('charge', 1200, from, till, 'absolute')).not.toThrow()
    })
    it('negative target', () => {
      expect(() => new ForciblyCharge('charge', -1, from, till, 'target')).toThrow()
    })
    it('target between 0 and 100 is OK', () => {
      expect(() => new ForciblyCharge('charge', 10, from, till, 'target')).not.toThrow()
    })
    it('target must be <100', () => {
      expect(() => new ForciblyCharge('charge', 101, from, till, 'target')).toThrow()
    })
    it('from must be before till - OK', () => {
      expect(() => new ForciblyCharge('charge', 10, from, till, 'absolute')).not.toThrow()
    })
    it('from must be before till - errored', () => {
      expect(() => new ForciblyCharge('charge', 20, till, from, 'target')).toThrow()
    })
  })

  describe('Period length calculation', () => {
    it('10:30 - 11:00 is 30 minutes', () => {
      expect(fCharge.periodInMinutes).toBeCloseTo(30)
    })
    it('10:30 - 11:00 is 1/2 hours', () => {
      expect(fCharge.periodInHours).toBeCloseTo(0.5)
    })
    it('0:30 - 23:15 is 22:15 hours', () => {
      from = parse('0:30', 'HH:mm', new Date())
      till = parse('22:15', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', 80, from, till, 'target')
      expect(fCharge.periodInHours).toBeCloseTo(21.75)
    })
  })

  describe('Calculate power from target', () => {
    it('80% to 100% in 1h => 2kW charge', () => {
      till = parse('11:30', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', 100, from, till, 'target')
      expect(fCharge.calcPower(80)).toBeCloseTo(2000)
    })
    it('80% to 100% in 30min => 4kW charge', () => {
      fCharge = new ForciblyCharge('charge', 100, from, till, 'target')
      expect(fCharge.calcPower(80)).toBeCloseTo(4000)
    })
    it('80% to 100% in 30min => 4kW charge', () => {
      fCharge = new ForciblyCharge('charge', 100, from, till, 'target')
      expect(fCharge.calcPower(80)).toBeCloseTo(4000)
    })
    it('60% to 10% in 2h => 2,5kW discharge', () => {
      till = parse('12:30', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('discharge', 10, from, till, 'target')
      expect(fCharge.calcPower(60)).toBeCloseTo(-2500)
    })
    it('charge 60% to 50% = no charging', () => {
      till = parse('12:30', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', 50, from, till, 'target')
      expect(fCharge.calcPower(60)).toBeUndefined()
    })
    it('discharge 10% to 80% = no charging', () => {
      fCharge = new ForciblyCharge('discharge', 80, from, till, 'target')
      expect(fCharge.calcPower(10)).toBeUndefined()
    })
  })

  describe('Holdoff', () => {
    it('charge 80% to 100%, holdoff 70%', () => {
      fCharge = new ForciblyCharge('charge', 100, from, till, 'target', 70)
      expect(fCharge.calcPower(71)).toBeUndefined()
    })
    it('discharge 50% to 20%, holdoff 49%', () => {
      fCharge = new ForciblyCharge('discharge', 70, from, till, 'target', 49)
      expect(fCharge.calcPower(50)).toBeUndefined()
    })
    it('charge from 80% @1000W, holdoff 70%', () => {
      fCharge = new ForciblyCharge('charge', 1000, from, till, 'absolute', 70)
      expect(fCharge.calcPower(80)).toBeUndefined()
    })
    it('discharge from 50% @1000, holdoff 49%', () => {
      fCharge = new ForciblyCharge('discharge', 1000, from, till, 'absolute', 51)
      expect(fCharge.calcPower(50)).toBeUndefined()
    })
  })
})
