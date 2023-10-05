import Joi from 'Joi'

const batteryConfigSchema = Joi.object({
  capacity: Joi.number().description('battery capacity in kWh'),
  maxChargePower: Joi.number().description('max charge power in Watt'),
  maxDischargePower: Joi.number().description('max discharge power in Watt'),
  lowerSocLimit: Joi.number().description('Discharge protection limit'),
  upperSocLimit: Joi.number().description('Overcharge protection limit'),
}).options({ presence: 'required' })

const homeAssistantCommand = Joi.object({
  url: Joi.string(),
  postData: Joi.object(),
  powerKey: Joi.string().default('power'),
  wattToPowerMultiplier: Joi.string().default(1),
  durationKey: Joi.string().default('duration'),
  minutesToDurationMultiplier: Joi.string().default(1),
}).options({ presence: 'required' })

const homeAssistantSchema = Joi.object({
  baseUrl: Joi.string().uri(),
  servicesUrl: Joi.string(),
  commands: Joi.object({
    forciblyChargeCommand: homeAssistantCommand.required(),
    forciblydischargeCommand: homeAssistantCommand.required(),
    stopForciblyChargeDischarge: homeAssistantCommand.required(),
  }),
}).options({ presence: 'required' })
