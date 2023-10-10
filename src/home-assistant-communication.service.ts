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
} from './config-validator.joi'
import { LoggerService } from './logger.service'

@Injectable()
export class HomeAssistantCommuncationService {
  private readonly _baseUrl: string
  private readonly _haStopChargeCommand: HA_StopChargeCmd
  private readonly _haForciblyChargeCommand: HA_ChargeCmd
  private readonly _haForciblyDischargeCommand: HA_ChargeCmd

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
  ) {
    const baseUrl = config.get([HA_CKEY, HA_BASEURL_CKEY])
    const bearer = config.get([HA_CKEY, HA_BEARER_TOKEN_CKEY])
    const headers = { Authorization: `Bearer ${bearer}` }
    HA_CommandBase.commonConfig = { baseUrl, options: { headers } }

    const cmdPrefix = [HA_CKEY, HA_CMD_CKEY]
    const stopConfig = config.get<HA_CmdConfigBase>([...cmdPrefix, HA_STOP_CMD_CKEY])
    this._haStopChargeCommand = new HA_StopChargeCmd(stopConfig)

    const chargeConfig = config.get<HA_ChgCmdConfig>([...cmdPrefix, HA_CHARGE_CKEY])
    this._haForciblyChargeCommand = new HA_ChargeCmd(chargeConfig)

    const dischargeConfig = config.get<HA_ChgCmdConfig>([...cmdPrefix, HA_DISCH_CMD_CKEY])
    this._haForciblyDischargeCommand = new HA_ChargeCmd(dischargeConfig)
  }

  stopForciblyCharge() {
    this._haStopChargeCommand.send()
  }

  startForcibly(/** in Watt */ power: number, /** in minutes */ time: number) {
    if (power > 0) {
      this._haForciblyChargeCommand.send(power, time)
    } else {
      this._haForciblyDischargeCommand.send(-power, time)
    }
  }

  startForciblyDischarge(/** in Watt */ power: number, /** in minutes */ time: number) {
    this._haForciblyDischargeCommand.send(power, time)
  }
}

interface HA_CmdConfigBase {
  url: string
  postData: Record<string, string | number>
}

interface HA_CmdCommonConfig {
  baseUrl: string
  options: { headers: Record<string, string> }
}

class HA_CommandBase<TConfig extends HA_CmdConfigBase> {
  static commonConfig: HA_CmdCommonConfig
  private urlJoin: any
  constructor(protected readonly _config: TConfig) {
    import('url-join').then(uj => (this.urlJoin = uj))
  }

  get url() {
    return this.urlJoin.default(HA_CommandBase.commonConfig.baseUrl, this._config.url)
  }
  get headers() {
    return HA_CommandBase.commonConfig.options
  }
}

class HA_StopChargeCmd extends HA_CommandBase<HA_CmdConfigBase> {
  constructor(config: HA_CmdConfigBase) {
    super(config)
  }
  async send() {
    try {
      const result = await axios.post(this.url, this._config.postData, this.headers)
    } catch (error) {}
  }
}

interface HA_ChgCmdConfig extends HA_CmdConfigBase {
  powerKey: string
  durationKey: string
  wattToPowerMultiplier: number
  minutesToDurationMultiplier: number
}

class HA_ChargeCmd extends HA_CommandBase<HA_ChgCmdConfig> {
  constructor(config: HA_ChgCmdConfig) {
    super(config)
  }

  async send(/** in Watt */ power: number, /** in minutes */ time: number) {
    // TODO: power en period nog berekenen
    const postData = this._config.postData
    postData[this._config.powerKey] = power * this._config.wattToPowerMultiplier
    postData[this._config.durationKey] = time * this._config.minutesToDurationMultiplier
    const result = await axios.post(this.url, this._config.postData, this.headers)
    console.log(result.statusText)
  }
}
