import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import * as axios from 'axios'
import {
  HA_BASEURL_CKEY,
  HA_CHARGE_CKEY,
  HA_DISCH_CMD_CKEY,
  HA_STOP_CMD_CKEY,
  HA_BEARER_TOKEN_CKEY,
  HA_CKEY,
  HA_CMD_CKEY,
} from '../config-validator.joi'
import { LoggerService } from '../logger.service'

interface CmdConfigBase {
  url: string
  postData: Record<string, string | number>
}

interface ChgCmdConfig extends CmdConfigBase {
  powerKey: string
  durationKey: string
  wattToPowerMultiplier: number
  minutesToDurationMultiplier: number
}

@Injectable()
export class HomeAssistantCommuncationService {
  private readonly _baseUrl: string
  private readonly _axiosOptions: any
  private readonly _haStopChargeConfig: CmdConfigBase
  private readonly _haForciblyChargeConfig: ChgCmdConfig
  private readonly _haForciblyDischargeConfig: ChgCmdConfig
  private readonly _dryRunProxy: () => boolean

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
  ) {
    this._baseUrl = config.get([HA_CKEY, HA_BASEURL_CKEY])
    const bearer = config.get([HA_CKEY, HA_BEARER_TOKEN_CKEY])
    const headers = { Authorization: `Bearer ${bearer}` }
    this._axiosOptions = { baseURL: this._baseUrl, headers }

    const cmdPrefix = [HA_CKEY, HA_CMD_CKEY]
    this._haStopChargeConfig = config.get<CmdConfigBase>([...cmdPrefix, HA_STOP_CMD_CKEY])
    this._haForciblyChargeConfig = config.get<ChgCmdConfig>([...cmdPrefix, HA_CHARGE_CKEY])
    this._haForciblyDischargeConfig = config.get<ChgCmdConfig>([...cmdPrefix, HA_DISCH_CMD_CKEY])
    this._dryRunProxy = config.createProxy('')
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
