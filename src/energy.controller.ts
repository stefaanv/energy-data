import { Controller, Get, Inject, Param } from '@nestjs/common'
import { IChargeTask } from './energy-actions/charge-task.interface'
import { EnergyService } from './energy.service'

@Controller('energy')
export class EnergyController {
  constructor(private readonly _service: EnergyService) {}

  @Get('tasks')
  getEnergyTasks(): IChargeTask[] {
    // const tasks = this._service.getEnergyTasks()
    // return tasks
    return []
  }
}
