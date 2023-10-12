import * as Joi from 'Joi'

export const HA_CKEY = 'homeAssistant'
export const HA_SERVICE_CKY = 'servicesUrl'
export const HA_BASEURL_CKEY = 'baseUrl'
export const HA_CMD_CKEY = 'commands'
export const HA_BEARER_TOKEN_CKEY = 'bearerToken'
export const HA_STOP_CMD_CKEY = 'stopForciblyChargeDischarge'
export const HA_CHARGE_CKEY = 'forciblyChargeCommand'
export const HA_DISCH_CMD_CKEY = 'forciblyDischargeCommand'
export const BELPEX_CKEY = 'belpexSpot'
export const BELPEX_URL_CKEY = 'url'
export const BELPEX_PARAMS_CKEY = 'params'

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
  [HA_BASEURL_CKEY]: Joi.string().uri(),
  [HA_SERVICE_CKY]: Joi.string(),
  [HA_BEARER_TOKEN_CKEY]: Joi.string(),
  [HA_CMD_CKEY]: Joi.object({
    [HA_CHARGE_CKEY]: homeAssistantCommand.required(),
    [HA_DISCH_CMD_CKEY]: homeAssistantCommand.required(),
    [HA_STOP_CMD_CKEY]: stopCommandSchema.required(),
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
  [HA_CKEY]: homeAssistantSchema.required(),
  taskList: Joi.array().items(chargeDischargeSchema).required(),
})
