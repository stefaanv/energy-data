import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common'
import { IChargeTask } from '../shared-models/charge-task.interface'
import { EnergyTasksService } from './energy-tasks.service'
import { IChargeTaskWire, chargeTaskFromWire } from '../shared-models/charge-task-wire.interface'

@Controller('energy')
export class EnergyController {
  constructor(private readonly _service: EnergyTasksService) {}

  @Get('tasks')
  async getEnergyTasks(): Promise<IChargeTask[]> {
    return this._service.allTasks()
  }

  @Put('task/add')
  async addEnergyTask(@Body() newTask: IChargeTaskWire) {
    const t = chargeTaskFromWire(newTask)
    return this._service.addTask(t)
  }

  @Post('task')
  async updateEnergyTask(@Body() task: IChargeTaskWire) {
    const t = chargeTaskFromWire(task)
    this._service.updateTask(t)
  }

  @Delete('task/:id')
  async deleteEnergyTask(@Param('id') id: string) {
    this._service.deleteTask(parseInt(id))
  }
}
