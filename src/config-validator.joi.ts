import * as Joi from 'Joi'

const batteryConfigSchema = Joi.object({
  capacity: Joi.number().description('battery capacity in kWh'),
  maxChargePower: Joi.number().description('max charge power in Watt'),
  maxDischargePower: Joi.number().description('max discharge power in Watt'),
  lowerSocLimit: Joi.number().description('Discharge protection limit'),
  upperSocLimit: Joi.number().description('Overcharge protection limit'),
}).options({ presence: 'required' })

const stopCommandSchema = Joi.object({
  url: Joi.string().required(),
})

const homeAssistantCommand = stopCommandSchema.append({
  postData: Joi.object().required(),
  powerKey: Joi.string().default('power'),
  wattToPowerMultiplier: Joi.number().default(1),
  durationKey: Joi.string().default('duration'),
  minutesToDurationMultiplier: Joi.number().default(1),
})

const homeAssistantSchema = Joi.object({
  baseUrl: Joi.string().uri(),
  servicesUrl: Joi.string(),
  commands: Joi.object({
    forciblyChargeCommand: homeAssistantCommand.required(),
    forciblyDischargeCommand: homeAssistantCommand.required(),
    stopForciblyChargeDischarge: stopCommandSchema.required(),
  }),
})

const chargeDischargeSchema = Joi.object({
  mode: Joi.string().valid('charge', 'discharge').required(),
  from: Joi.date(),
  till: Joi.date(),
  power: Joi.number().positive(),
  target: Joi.number().positive().min(0).max(100).optional(),
  holdoff: Joi.number().positive().min(0).max(100).optional(),
}).options({ presence: 'required' })

export const configValidationSchema = Joi.object({
  batteryMonitorInterval: Joi.number().description('in seconds'),
  TimeZone: Joi.string().default('Europe/Brussels'),
  batteryConfig: batteryConfigSchema.required(),
  homeAssistant: homeAssistantSchema.required(),
  taskList: Joi.array().items(chargeDischargeSchema).required(),
})
