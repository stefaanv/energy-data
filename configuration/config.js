exports.default = () => ({
  activateCommandKeyWatcher: false,
  batteryMonitorInterval: 10,
  timeZone: 'Europe/Brussels',
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
      forciblyChargeCommand: {
        url: 'services/huawei_solar/forcible_charge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
          power: 0,
          duration: 0,
        },
      },
      forciblyDischargeCommand: {
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
      smartMeter: {
        url: 'states',
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
      from: '2023-10-14 14:00:00',
      till: '2023-10-14 17:00:00',
      power: 2000,
    },
  ],
})
