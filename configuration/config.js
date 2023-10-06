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
  homeAssistant: {
    baseUrl: 'http://homeassistant.local:8123/api/services',
    servicesUrl: 'services',
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
      mode: 'discharge',
      from: '2023-10-06 21:00:30',
      till: '2023-10-06 21:59:30',
      power: 2000,
    },
  ],
})
