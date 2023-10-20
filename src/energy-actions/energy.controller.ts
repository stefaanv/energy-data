import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common'
import { IChargeTask } from '../shared-models/charge-task.interface'
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

  @Post('tasks/:id')
  async updateEnergyTask(@Body() task: IChargeTaskWire, @Param('id') id: number) {
    const t = chargeTaskFromWire(task)
    this._service.updateTask(t, id)
  }

  @Delete('tasks/:id')
  async deleteEnergyTask(@Param('id') id: string) {
    this._service.deleteTask(parseInt(id))
  }
}
