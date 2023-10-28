import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import * as axios from 'axios'
import { LoggerService } from '../logger.service'
import { select, sum } from 'radash'

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

export interface EnergyData {
  time: Date
  power: { consumption: number; production: number }
  energy: { consumption: number; production: number; monthlyPeak?: number }
  battery: { soc: number; chargePower: number }
  inverter: { inputPower: number }
  grid: { power: number }
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

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
  ) {
    this._baseUrl = config.get('homeAssistant.baseUrl')
    const bearer = config.get('homeAssistant.bearerToken')
    const headers = { Authorization: `Bearer ${bearer}` }
    this._axiosOptions = { baseURL: this._baseUrl, headers }

    this._haStopChargeConfig = config.get<CmdConfigBase>(
      'homeAssistant.commands.stopForciblyChargeDischarge',
    )
    this._haForciblyChargeConfig = config.get<ChgCmdConfig>('homeAssistant.commands.forciblyCharge')
    this._haForciblyDischargeConfig = config.get<ChgCmdConfig>(
      'homeAssistant.commands.forciblyDischarge',
    )
    this._haSmartMeterIds = config.get<SmartMeterIds>('homeAssistant.sensors.smartMeter')
    this._haInverterIds = config.get<InverterIds>('homeAssistant.sensors.inverter')
    this._dryRunProxy = config.createProxy('')
  }

  async getEnergyData(): Promise<EnergyData> {
    const sumSelect = (a: HomeAssistantEntity[], ids: string[]) =>
      sum(
        a.filter(e => ids.includes(e.entity_id)),
        e => parseFloat(e.state),
      )
    const time = new Date()
    const smConfig = this._haSmartMeterIds
    const invConfig = this._haInverterIds
    const baseUrl = this._baseUrl + '/states'
    try {
      const allStates = (await axios.get<HomeAssistantEntity[]>(baseUrl, this._axiosOptions)).data

      return {
        time,
        power: {
          production: sumSelect(allStates, [smConfig.powerProduction]),
          consumption: sumSelect(allStates, [smConfig.powerConsumption]),
        },
        energy: {
          production: sumSelect(allStates, smConfig.productionEntity),
          consumption: sumSelect(allStates, smConfig.consumptionEntity),
        },
        battery: {
          soc: sumSelect(allStates, [invConfig.batterySoc]),
          chargePower: sumSelect(allStates, [invConfig.chargePower]),
        },
        inverter: {
          inputPower: sumSelect(allStates, [invConfig.inputPower]),
        },
        grid: {
          power: sumSelect(allStates, [invConfig.pmActivePower]),
        },
      }
    } catch (error) {
      console.log(error)
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
    } catch (error) {
      console.log(error)
    }
  }

  async startForcibly(/** in Watt */ power: number, /** in minutes */ time: number) {
    if (this._dryRunProxy()) {
      this._log.warn(`dryRun active - not starting`)
      return
    }

    const config = power > 0 ? this._haForciblyChargeConfig : this._haForciblyDischargeConfig
    const url = config.url //joinUrlParts(this._baseUrl, config.url)
    const postData = config.postData
    const powerInWatt = Math.abs(power * config.wattToPowerMultiplier)
    postData[config.powerKey] = powerInWatt
    const periodInMin = time * config.minutesToDurationMultiplier
    postData[config.durationKey] = periodInMin
    try {
      await axios.post(url, config.postData, this._axiosOptions)
    } catch (error) {
      console.error(error.message)
    }
  }
}
