import { BatteryConfig, ForciblyCharge } from './forcibly-load'
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
      lowerSocLimit: 11,
      upperSocLimit: 100,
    }
    from = parse('10:30', 'HH:mm', new Date())
    till = parse('11:00', 'HH:mm', new Date())
    fCharge = new ForciblyCharge('charge', from, till, 1200)
  })

  describe('illegal construction parameters must throw', () => {
    it('negative absolute power', () => {
      expect(() => new ForciblyCharge('charge', from, till, -1200)).toThrow()
    })
    it('positive absolute power is OK', () => {
      expect(() => new ForciblyCharge('charge', from, till, 1200)).not.toThrow()
    })
    it('negative target', () => {
      expect(() => new ForciblyCharge('charge', from, till, 1000, -1)).toThrow()
    })
    it('target between 0 and 100 is OK', () => {
      expect(() => new ForciblyCharge('charge', from, till, 1000, 10)).not.toThrow()
    })
    it('target must be <100', () => {
      expect(() => new ForciblyCharge('charge', from, till, 1000, 101)).toThrow()
    })
    it('from must be before till - OK', () => {
      expect(() => new ForciblyCharge('charge', from, till, 1000, 10)).not.toThrow()
    })
    it('from must be before till - errored', () => {
      expect(() => new ForciblyCharge('charge', till, from, 1000, 20)).toThrow()
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
      fCharge = new ForciblyCharge('charge', from, till, 1000, 80)
      expect(fCharge.periodInHours).toBeCloseTo(21.75)
    })
  })

  describe('Calculate power from target', () => {
    it('80% to 100% in 1h => 2kW charge', () => {
      till = parse('11:30', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', from, till, 3000, 100)
      expect(fCharge.calcPower(80)).toBeCloseTo(2000)
    })
    it('80% to 100% in 30min => 4kW charge', () => {
      fCharge = new ForciblyCharge('charge', from, till, 5000, 100)
      expect(fCharge.calcPower(80)).toBeCloseTo(4000)
    })
    it('80% to 100% in 30min => 4kW charge', () => {
      fCharge = new ForciblyCharge('charge', from, till, 5000, 100)
      expect(fCharge.calcPower(80)).toBeCloseTo(4000)
    })
    it('60% to 10% in 2h => 2,5kW discharge', () => {
      till = parse('12:30', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('discharge', from, till, 5000, 20)
      expect(fCharge.calcPower(60)).toBeCloseTo(-2000)
    })
    it('charge 60% to 50% = no charging', () => {
      till = parse('12:30', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', from, till, 5000, 50)
      expect(fCharge.calcPower(60)).toBeUndefined()
    })
    it('discharge 10% to 80% = no charging', () => {
      fCharge = new ForciblyCharge('discharge', from, till, 5000, 80)
      expect(fCharge.calcPower(10)).toBeUndefined()
    })
  })

  describe('Holdoff', () => {
    it('charge to 100%, holdoff 70%', () => {
      fCharge = new ForciblyCharge('charge', from, till, 1000, undefined, 70)
      expect(fCharge.calcPower(71)).toBeUndefined()
    })
    it('discharge to 20%, holdoff 30%', () => {
      fCharge = new ForciblyCharge('discharge', from, till, 1000, 20, 30)
      expect(fCharge.calcPower(29)).toBeUndefined()
    })
    it('charge @1000W, holdoff 70%', () => {
      fCharge = new ForciblyCharge('charge', from, till, 1000, undefined, 70)
      expect(fCharge.calcPower(80)).toBeUndefined()
    })
    it('discharge @1000, holdoff 49%', () => {
      fCharge = new ForciblyCharge('discharge', from, till, 1000, undefined, 49)
      expect(fCharge.calcPower(48)).toBeUndefined()
    })
  })

  describe('Power limits', () => {
    it('set power limit', () => {
      fCharge = new ForciblyCharge('charge', from, till, 1000)
      expect(fCharge.calcPower(11)).toBeCloseTo(1000)
    })
    it('inverter power limit', () => {
      fCharge = new ForciblyCharge('charge', from, till, 10000)
      expect(fCharge.calcPower(11)).toBeCloseTo(5000)
    })
    it('set power limit', () => {
      fCharge = new ForciblyCharge('discharge', from, till, 1000)
      expect(fCharge.calcPower(100)).toBeCloseTo(-1000)
    })
    it('inverter power limit', () => {
      fCharge = new ForciblyCharge('discharge', from, till, 10000)
      expect(fCharge.calcPower(100)).toBeCloseTo(-5000)
    })
  })

  describe('Battery limits', () => {
    it('upper charge limit 50%', () => {
      ForciblyCharge.config.upperSocLimit = 50
      from = parse('10:00', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', from, till, 5000, 70)
      expect(fCharge.calcPower(40)).toBeCloseTo(1000)
    })

    it('No charging if already above battery soc limit', () => {
      ForciblyCharge.config.upperSocLimit = 50
      from = parse('10:00', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('charge', from, till, 5000, 100)
      expect(fCharge.calcPower(51)).toBeUndefined()
    })

    it('lower charge limit 30%', () => {
      ForciblyCharge.config.lowerSocLimit = 50
      from = parse('10:00', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('discharge', from, till, 5000, 20)
      expect(fCharge.calcPower(60)).toBeCloseTo(-1000)
    })

    it('No discharging if already below battery soc limit', () => {
      ForciblyCharge.config.lowerSocLimit = 50
      from = parse('10:00', 'HH:mm', new Date())
      fCharge = new ForciblyCharge('discharge', from, till, 5000, 20)
      expect(fCharge.calcPower(49)).toBeUndefined()
    })
  })
})
