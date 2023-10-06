import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  constructor(private readonly _config: ConfigService) {}
  getHello(): string {
    return 'Hello World!'
  }
  getConfig(): object {
    return this._config.config
  }
}
