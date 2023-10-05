exports.default = () => ({
  version: '{{pkg.version}}',
  activateCommandKeyWatcher: false,
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
        powerKey: 'power',
        wattToPowerMultiplier: 1,
        durationKey: 'duration',
        minutesToDurationMultiplier: 1,
      },
    },
  },
})
