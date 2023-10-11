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
  dynamicPrices: {
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
    baseUrl: 'http://homeassistant.local:8123/api/services',
    bearerToken: '{{ENV_BEARER_TOKEN}}',
    servicesUrl: '/services',
    commands: {
      forciblyChargeCommand: {
        url: 'huawei_solar/forcible_charge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
          power: 0,
          duration: 0,
        },
      },
      forciblyDischargeCommand: {
        url: 'huawei_solar/forcible_discharge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
          power: 0,
          duration: 0,
        },
      },
      stopForciblyChargeDischarge: {
        url: 'huawei_solar/stop_forcible_charge',
        postData: {
          device_id: 'd36a4ede8885b40373c9b4d100e7f139',
        },
      },
    },
  },
  taskList: [
    {
      mode: 'charge',
      from: '2023-10-11 16:00:00',
      till: '2023-10-11 17:00:00',
      power: 2000,
    },
    {
      mode: 'charge',
      from: '2023-10-12 03:00:00',
      till: '2023-10-12 05:59:00',
      power: 2000,
    },
  ],
})
