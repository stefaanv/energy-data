import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common'
import { IChargeTask } from './charge-task.interface'
import { EnergyService } from './energy.service'
import { IChargeTaskWire, chargeTaskFromWire } from '../shared-models/charge-task-wire.interface'

@Controller('energy')
export class EnergyController {
  constructor(private readonly _service: EnergyService) {}

  @Get('tasks')
  async getEnergyTasks(): Promise<IChargeTask[]> {
    return this._service.allTasks()
  }

  @Put('tasks/add')
  async addEnergyTask(@Body() newTask: IChargeTaskWire) {
    const t = chargeTaskFromWire(newTask)
    this._service.addTask(t)
  }
}
