import { Controller, Get, Inject, Param } from '@nestjs/common'
import { ChargeTask } from './shared-models/charge-task.model'
import { EnergyService } from './energy.service'

@Controller('energy')
export class EnergyController {
  constructor(private readonly _service: EnergyService) {}

  @Get('tasks')
  getEnergyTasks(): ChargeTask[] {
    const tasks = this._service.getEnergyTasks()
    return tasks
  }
}
