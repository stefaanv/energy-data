const { parse } = require('date-fns')
const DT_FORMAT = 'dd/MM/yyyy HH:mm'
const now = new Date()

exports.default = () => ({
  activateCommandKeyWatcher: false,
  batteryMonitorInterval: 10,
  monitorIntervalSec: 30,
  timeZone: 'Europe/Brussels',
  haDryRun: true,
  batteryConfig: {
    capacity: 10,
    maxChargePower: 5000,
    maxDischargePower: 5000,
    lowerSocLimit: 11,
    upperSocLimit: 100,
  },
  belpexSpot: {
    url: 'https://spot.56k.guru/api/v2/hass',
    params: {
      currency: 'EUR',
      area: 'BE',
      multiplier: 1,
      extra: 0,
      factor: 1,
      decimals: 5,
    },
  },
  homeAssistant: {
    baseUrl: 'http://homeassistant.local:8123/api',
    bearerToken: '{{ENV_BEARER_TOKEN}}',
    servicesUrl: '/services',
    commands: {
      forciblyCharge: {
        url: 'services/huawei_solar/forcible_charge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
          power: 0,
          duration: 0,
        },
      },
      forciblyDischarge: {
        url: 'services/huawei_solar/forcible_discharge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
          power: 0,
          duration: 0,
        },
      },
      stopForciblyChargeDischarge: {
        url: 'services/huawei_solar/stop_forcible_charge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
        },
      },
    },
    sensors: {
      smartMeter: {
        url: 'states',
        powerConsumed: 'sensor.power_consumed',
        powerProduced: 'sensor.power_produced',
        consumptionEntityIds: [
          'sensor.energy_consumed_tariff_1',
          'sensor.energy_consumed_tariff_2',
        ],
        productionEntityIds: ['sensor.energy_produced_tariff_1', 'sensor.energy_produced_tariff_2'],
      },
    },
  },
  taskList: [
    {
      mode: 'charge',
      from: parse('22/10/2023 10:00', DT_FORMAT, now),
      till: parse('22/10/2023 11:00', DT_FORMAT, now),
      power: 2000,
    },
    {
      mode: 'discharge',
      from: parse('23/10/2023 14:00', DT_FORMAT, now),
      till: parse('23/10/2023 15:00', DT_FORMAT, now),
      power: 1800,
    },
  ],
})
