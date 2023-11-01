import { Controller, Get } from '@nestjs/common'
import { MonitorService } from './monitoring.service'

@Controller('monitor')
export class MonitorController {
  constructor(private readonly _service: MonitorService) {}

  @Get('status')
  async getStatus() {
    return this._service.status
  }

  @Get('energy-data')
  async getCurrentEnergyData() {
    return this._service.currentEnergyData
  }
}
