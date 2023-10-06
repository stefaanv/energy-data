import { BatteryConfig, ChargeSetting, ForciblyCharge } from './forcibly-load'
import { parse } from 'date-fns'

describe('forcibly charge tests - absolute power', () => {
  let fc: ForciblyCharge
  let from: Date
  let till: Date
  let setting: ChargeSetting

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
    setting = { mode: 'charge', from, till, power: 5000 }
    fc = new ForciblyCharge(setting)
  })

  describe('illegal construction parameters must throw', () => {
    it('negative absolute power', () => {
      setting.power = -1200
      fc = new ForciblyCharge(setting)
      expect(fc._power).toBeCloseTo(0)
    })
    it('positive absolute power is OK', () => {
      expect(() => new ForciblyCharge(setting)).not.toThrow()
    })
    it('negative target is set to 0', () => {
      setting.target = -1
      fc = new ForciblyCharge(setting)
      expect(fc._target).toBeCloseTo(ForciblyCharge.config.lowerSocLimit)
    })
    it('target between 0 and 100 is OK', () => {
      setting.target = 10
      expect(() => new ForciblyCharge(setting)).not.toThrow()
    })
    it('target must be <100', () => {
      setting.target = 101
      fc = new ForciblyCharge(setting)
      expect(fc._target).toBeCloseTo(ForciblyCharge.config.upperSocLimit)
    })
    it('from must be before till - OK', () => {
      expect(() => new ForciblyCharge(setting)).not.toThrow()
    })
    it('from must be before till - errored', () => {
      setting.till = from
      setting.from = till
      expect(() => new ForciblyCharge(setting)).toThrow()
    })
  })

  describe('Period length calculation', () => {
    it('10:30 - 11:00 is 30 minutes', () => {
      expect(fc.periodInMinutes).toBeCloseTo(30)
    })
    it('10:30 - 11:00 is 1/2 hours', () => {
      expect(fc.periodInHours).toBeCloseTo(0.5)
    })
    it('0:30 - 23:15 is 22:15 hours', () => {
      setting.from = parse('0:30', 'HH:mm', new Date())
      setting.till = parse('22:15', 'HH:mm', new Date())
      fc = new ForciblyCharge(setting)
      expect(fc.periodInHours).toBeCloseTo(21.75)
    })
  })

  describe('Calculate power from target', () => {
    it('80% to 100% in 1h => 2kW charge', () => {
      setting.till = parse('11:30', 'HH:mm', new Date())
      setting.target = 100
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(80)).toBeCloseTo(2000)
    })
    it('80% to 100% in 30min => 4kW charge', () => {
      setting.target = 100
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(80)).toBeCloseTo(4000)
    })
    it('60% to 100% in 1h => 4kW charge', () => {
      setting.till = parse('11:30', 'HH:mm', new Date())
      setting.target = 100
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(60)).toBeCloseTo(4000)
    })
    it('60% to 10% in 2h => 2,5kW discharge', () => {
      setting.till = parse('12:30', 'HH:mm', new Date())
      setting.target = 20
      setting.mode = 'discharge'
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(60)).toBeCloseTo(-2000)
    })
    it('charge 60% to 50% = no charging', () => {
      setting.till = parse('12:30', 'HH:mm', new Date())
      setting.target = 50
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(60)).toBeUndefined()
    })
    it('discharge 10% to 80% = no charging', () => {
      setting.target = 50
      setting.mode = 'discharge'
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(10)).toBeUndefined()
    })
  })

  describe('Holdoff', () => {
    it('charge to 100%, holdoff 70%', () => {
      setting.holdOff = 70
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(71)).toBeUndefined()
    })
    it('discharge to 20%, holdoff 30%', () => {
      setting.target = 20
      setting.holdOff = 30
      setting.mode = 'discharge'
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(29)).toBeUndefined()
    })
    it('charge @1000W, holdoff 70%', () => {
      setting.holdOff = 30
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(80)).toBeUndefined()
    })
    it('discharge @1000, holdoff 49%', () => {
      setting.mode = 'discharge'
      setting.holdOff = 49
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(48)).toBeUndefined()
    })
  })

  describe('Power limits', () => {
    it('set power limit', () => {
      setting.power = 1000
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(11)).toBeCloseTo(1000)
    })
    it('inverter power limit', () => {
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(11)).toBeCloseTo(5000)
    })
    it('set power limit', () => {
      setting.mode = 'discharge'
      setting.power = 1000
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(100)).toBeCloseTo(-1000)
    })
    it('inverter power limit', () => {
      setting.mode = 'discharge'
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(100)).toBeCloseTo(-5000)
    })
  })

  describe('Battery limits', () => {
    beforeEach(() => {
      setting.from = parse('10:00', 'HH:mm', new Date())
    })

    it('upper charge limit 50%', () => {
      ForciblyCharge.config.upperSocLimit = 50
      setting.target = 70
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(40)).toBeCloseTo(1000)
    })

    it('No charging if already above battery soc limit', () => {
      ForciblyCharge.config.upperSocLimit = 50
      setting.target = 100
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(51)).toBeUndefined()
    })

    it('lower charge limit 30%', () => {
      ForciblyCharge.config.lowerSocLimit = 50
      setting.target = 20
      setting.mode = 'discharge'
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(60)).toBeCloseTo(-1000)
    })

    it('No discharging if already below battery soc limit', () => {
      ForciblyCharge.config.lowerSocLimit = 50
      setting.target = 20
      setting.mode = 'discharge'
      fc = new ForciblyCharge(setting)
      expect(fc.calcPower(49)).toBeUndefined()
    })
  })
})
