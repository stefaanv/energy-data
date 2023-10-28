import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
// import { SchedulerRegistry } from '@nestjs/schedule'
import { BatteryConfig, ChargeTask } from './charge-task.class'
import { HaCommService } from './home-assistant-communication.service'
import { assign, sort } from 'radash'
import { IChargeTask, chargeTaskSettingToString } from '../shared-models/charge-task.interface'
import { differenceInSeconds, subHours } from 'date-fns'
import { LoggerService } from '@src/logger.service'
import { EntityManager, EntityRepository } from '@mikro-orm/core'
import { ChargeTaskEntity } from '@src/entities/energy-tasks.entity'

@Injectable()
export class EnergyService {
  private _taskListProxy: () => Array<IChargeTask>
  private _taskListRepo: EntityRepository<ChargeTaskEntity>

  constructor(
    config: ConfigService,
    // private _schedulerRegistry: SchedulerRegistry,
    // private readonly _commService: HomeAssistantCommuncationService,
    private readonly _log: LoggerService,
    private readonly _em: EntityManager,
  ) {
    this._taskListRepo = this._em.getRepository(ChargeTaskEntity)
    ChargeTask.config = config.get<BatteryConfig>('batteryConfig')
    this._taskListProxy = config.createProxy<Array<IChargeTask>>('taskList')
    // const schedulerPeriodMs = 1000 * config.get<number>('batteryMonitorInterval')
    // const schedulerInterval = setInterval(() => this.monitor(), schedulerPeriodMs)
    // this._schedulerRegistry.addInterval('monitorInterval', schedulerInterval)
    this.loadTaskListFromConfig()
    config.on('reloaded', () => this.loadTaskListFromConfig())
  }

  async loadTaskListFromConfig() {
    const em = this._em.fork()
    const taskListRepo = em.getRepository(ChargeTaskEntity)
    const taskList = await taskListRepo.find({})
    for (const ctl of this._taskListProxy()) {
      const inTaskList = taskList.find(t => Math.abs(differenceInSeconds(t.from, ctl.from)) <= 5)
      if (inTaskList) {
        assign(inTaskList, ctl)
      } else {
        em.insert(ChargeTaskEntity, ctl)
      }
    }
    await em.flush()
    setTimeout(() => {
      this.printTaskList(taskList)
    }, 500)
  }

  async printTaskList(tl?: ChargeTaskEntity[]) {
    const taskList = tl ?? (await this.allTasks())
    if (taskList.length === 0) {
      console.log('tasklist is empty')
    } else {
      console.log('\ncurrent tasklist')
      console.log('================')
      sort(taskList, t => t.from.getTime()).forEach(s => console.log(chargeTaskSettingToString(s)))
    }
  }

  async allTasks(since: Date = subHours(new Date(), 12)) {
    const em = this._em.fork()
    const taskListRepo = em.getRepository(ChargeTaskEntity)
    return taskListRepo.find({ from: { $gt: since } }, { orderBy: { from: 'asc' } })
  }

  async addTask(newTask: IChargeTask) {
    delete newTask.id
    const taskId = await this._em.insert(ChargeTaskEntity, newTask)
    this.printTaskList()
    return taskId
  }

  async updateTask(task: IChargeTask) {
    await this._em.upsert(ChargeTaskEntity, task)
    this.printTaskList()
  }

  async deleteTask(id: number) {
    await this._em.nativeDelete(ChargeTaskEntity, { id })
    this.printTaskList()
  }

  /*
  async monitor() {
    const now = new Date()
    const em = this._em.fork()
    const taskList = await em.find(ChargeTaskEntity, { from: { $gt: now } })

    for (const t of taskList) {
      const task = new ChargeTask(t)
      if (task.isWithinPeriod(now) && !task.commandSent) {
        const duration = task.periodInMinutes()
        const sign = task.setting.mode === 'charge' ? 1 : -1
        this._commService.startForcibly(sign * task._power, duration)
        task.commandSent = true
      }
    }
  }
  */
}
