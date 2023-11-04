import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import * as axios from 'axios'
import { LoggerService } from '../logger.service'
import { sum } from 'radash'
import { format } from 'date-fns-tz'
import { TZ_OPTIONS } from '@src/helpers/time.helpers'
import { EnergyData } from './energy-data.model'

interface CmdConfigBase {
  url: string
  postData: Record<string, string | number>
}

interface SmartMeterIds {
  url: string
  powerConsumption: string
  powerProduction: string
  consumptionEntity: string[]
  productionEntity: string[]
}

interface InverterIds {
  batterySoc: string
  chargePower: string
  inputPower: string
  pmActivePower: string
}

interface ChgCmdConfig extends CmdConfigBase {
  powerKey: string
  durationKey: string
  wattToPowerMultiplier: number
  minutesToDurationMultiplier: number
}

interface HomeAssistantEntity {
  entity_id: string
  state: string
}

@Injectable()
export class HaCommService {
  private readonly _baseUrl: string
  private readonly _axiosOptions: any
  private readonly _haStopChargeConfig: CmdConfigBase
  private readonly _haForciblyChargeConfig: ChgCmdConfig
  private readonly _haForciblyDischargeConfig: ChgCmdConfig
  private readonly _haSmartMeterIds: SmartMeterIds
  private readonly _haInverterIds: InverterIds
  private readonly _dryRunProxy: () => boolean
  private readonly _allSensorIds: string[]
  private _lastValid: EnergyData = undefined

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
  ) {
    this._baseUrl = config.get('homeAssistant.baseUrl')
    const bearer = config.get('homeAssistant.bearerToken')
    const headers = { Authorization: `Bearer ${bearer}` }
    this._axiosOptions = { baseURL: this._baseUrl, headers }

    this._haStopChargeConfig = config.get<CmdConfigBase>('homeAssistant.commands.stopForciblyChargeDischarge')
    this._haForciblyChargeConfig = config.get<ChgCmdConfig>('homeAssistant.commands.forciblyCharge')
    this._haForciblyDischargeConfig = config.get<ChgCmdConfig>('homeAssistant.commands.forciblyDischarge')
    this._haSmartMeterIds = config.get<SmartMeterIds>('homeAssistant.sensors.smartMeter')
    this._haInverterIds = config.get<InverterIds>('homeAssistant.sensors.inverter')
    this._dryRunProxy = config.createProxy<boolean>('haDryRun', true)
    this._allSensorIds = [
      ...Object.values(this._haSmartMeterIds).flat(),
      ...Object.values(this._haInverterIds).flat(),
    ]
  }

  async getEnergyData(): Promise<EnergyData | undefined> {
    const time = new Date()
    const smConfig = this._haSmartMeterIds
    const invConfig = this._haInverterIds
    const url = this._baseUrl + '/states'
    try {
      const allStates = (await axios.get<HomeAssistantEntity[]>(url, this._axiosOptions)).data.filter(s =>
        this._allSensorIds.includes(s.entity_id),
      )

      // niet alle waarden komen altijd door vanuit HA, bvb
      // {"time":"2023-10-30T11:48:00.011Z","power":{"production":0,"consumption":1.389},"energy":{"production":4725.201,"consumption":3885.562},"battery":{"soc":null,"chargePower":null},"inverter":{"inputPower":null},"grid":{"power":null}}
      // Laatste geldige waarden bijhouden en meegeven indien geen geldige gekregen
      const data = {
        time,
        power: {
          production: sumSelect(allStates, [smConfig.powerProduction]) ?? this._lastValid.power.production,
          consumption: sumSelect(allStates, [smConfig.powerConsumption]) ?? this._lastValid.power.consumption,
        },
        energy: {
          production: sumSelect(allStates, smConfig.productionEntity) ?? this._lastValid.energy.production,
          consumption: sumSelect(allStates, smConfig.consumptionEntity) ?? this._lastValid.energy.consumption,
        },
        battery: {
          soc: sumSelect(allStates, [invConfig.batterySoc]) ?? this._lastValid.battery.soc,
          chargePower: sumSelect(allStates, [invConfig.chargePower]) ?? this._lastValid.battery.chargePower,
        },
        inverter: {
          inputPower: sumSelect(allStates, [invConfig.inputPower]) ?? this._lastValid.inverter.inputPower,
        },
        grid: {
          power: sumSelect(allStates, [invConfig.pmActivePower]) ?? this._lastValid.grid.power,
        },
      }
      if (!this._lastValid) {
        this._lastValid = data
      }

      return data
    } catch (error) {
      this._log.error(`unable to get HA energy data: ${error.message}`, error, `url: ${url}`)
      return undefined
    }
  }

  async stopForciblyCharge() {
    if (this._dryRunProxy()) {
      this._log.warn(`dryRun active - not stopping`)
      return
    }
    const config = this._haStopChargeConfig
    const url = this._baseUrl + '/' + config.url
    try {
      await axios.post(url, config.postData, this._axiosOptions)
      const date = format(new Date(), 'd/MM HH:mm', TZ_OPTIONS)
      const msg = `Stopped forcibly charge/discharge at ${date}`
      this._log.log(msg)
    } catch (error) {
      console.log(error)
    }
  }

  async startForcibly(/** in Watt */ power: number, /** in minutes */ duration: number) {
    if (this._dryRunProxy()) {
      this._log.warn(`dryRun active - not starting`)
      return
    }

    const config = power > 0 ? this._haForciblyChargeConfig : this._haForciblyDischargeConfig
    const url = config.url //joinUrlParts(this._baseUrl, config.url)
    const postData = config.postData
    const powerInWatt = Math.abs(power * config.wattToPowerMultiplier)
    postData[config.powerKey] = powerInWatt
    const periodInMin = duration * config.minutesToDurationMultiplier
    postData[config.durationKey] = periodInMin
    try {
      await axios.post(url, config.postData, this._axiosOptions)
      const date = format(new Date(), 'd/MM HH:mm', TZ_OPTIONS)
      const mode = power > 0 ? 'charge' : 'discharge'
      const msg = `Started ${Math.abs(power)}W forcibly ${mode} for ${duration} minutes at ${date}`
      this._log.log(msg)
    } catch (error) {
      this._log.error(error.message)
      console.error('url:', url)
      console.error('body:', config.postData)
    }
  }
}

function sumSelect(a: HomeAssistantEntity[], ids: string[]): number | undefined {
  const addition = sum(
    a.filter(e => ids.includes(e.entity_id)),
    e => parseFloat(e.state),
  )
  if (isNaN(addition)) return undefined
  return addition
}
