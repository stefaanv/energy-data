import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { BatteryConfig, ChargeTask } from './charge-task.class'
import { HomeAssistantCommuncationService } from '../home-assistant-communication.service'
import { assign, max, sort } from 'radash'
import { IChargeTask, chargeTaskSettingToString } from '../shared-models/charge-task.interface'
import { IChargeTaskWire } from 'src/shared-models/charge-task-wire.interface'
import { findIndex } from 'rxjs'
import { subHours } from 'date-fns'

@Injectable()
export class EnergyService {
  private _timeZone: string
  private _taskList: Array<ChargeTask> = []
  private _idCounter = 0
  private _tlProxy: () => Array<IChargeTask>

  constructor(
    config: ConfigService,
    private _schedulerRegistry: SchedulerRegistry,
    private readonly _commService: HomeAssistantCommuncationService,
  ) {
    ChargeTask.config = config.get<BatteryConfig>('batteryConfig')
    this._tlProxy = config.createProxy<Array<IChargeTask>>('taskList')
    this._timeZone = config.get('timeZone')
    const schedulerPeriodMs = 1000 * config.get<number>('batteryMonitorInterval')
    const schedulerInterval = setInterval(() => this.monitor(), schedulerPeriodMs)
    this._schedulerRegistry.addInterval('monitorInterval', schedulerInterval)
    this.loadTaskListFromConfig()
    config.on('reloaded', () => this.loadTaskListFromConfig())
  }

  loadTaskListFromConfig() {
    for (const ctl of this._tlProxy()) {
      const inTaskList = this._taskList.find(t => t.setting.from === ctl.from)
      if (inTaskList) {
        assign(inTaskList.setting, ctl)
      } else {
        ctl.id = max(this._taskList.map(tl => tl.setting.id)) + 1
        this._taskList.push(new ChargeTask(ctl))
      }
    }
    setTimeout(this.printTaskList.bind(this), 500)
  }

  printTaskList() {
    if (this._taskList.length === 0) {
      console.log('tasklist is empty')
    } else {
      console.log('\ncurrent tasklist')
      console.log('================')
      sort(
        this._taskList.map(tl => tl.setting),
        t => t.from.getTime(),
      ).forEach(s => console.log(chargeTaskSettingToString(s)))
    }
  }

  allTasks(since: Date = subHours(new Date(), 12)) {
    return sort(
      this._taskList.map(ct => ct.setting),
      ct => ct.from.getTime(),
    )
  }

  addTask(newTask: IChargeTask) {
    newTask.id = max(this._taskList.map(tl => tl.setting.id)) + 1
    this._taskList.push(new ChargeTask(newTask))
    this.printTaskList()
    return newTask.id
  }

  updateTask(task: IChargeTask, id: number) {
    const taskToUpdate = this._taskList.find(t => t.setting.id == id)
    if (!taskToUpdate) {
      const msg = `task with id=${id} does not exist`
      throw new HttpException(msg, HttpStatus.NOT_FOUND)
    }
    task.id = taskToUpdate.setting.id
    taskToUpdate.setting = task
    this.printTaskList()
  }

  deleteTask(id: number) {
    const index = this._taskList.map(tl => tl.setting).findIndex(s => s.id === id)
    if (index < 0) {
      const msg = `task with id=${id} does not exist`
      throw new HttpException(msg, HttpStatus.NOT_FOUND)
    }

    this._taskList.splice(index, 1)
    this.printTaskList()
  }

  monitor() {
    const now = new Date()
    // console.log(format(now, 'HH:mm:ss'))
    for (const fc of this._taskList) {
      if (fc.isWithinPeriod(now) && !fc.commandSent) {
        const duration = fc.periodInMinutes()
        const sign = fc.setting.mode === 'charge' ? 1 : -1
        this._commService.startForcibly(sign * fc._power, duration)
        fc.commandSent = true
      }
    }
  }
}
