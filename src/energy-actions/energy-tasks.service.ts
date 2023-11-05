import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { BatteryConfig, ChargeTask } from './charge-task.class'
import { assign, sort, tryit } from 'radash'
import { IChargeTask, chargeTaskSettingToString } from '../shared-models/charge-task.interface'
import { differenceInSeconds, subHours } from 'date-fns'
import { LoggerService } from '@src/logger.service'
import { EntityManager, EntityRepository } from '@mikro-orm/core'
import { ChargeTaskEntity } from '@src/entities/energy-tasks.entity'

@Injectable()
export class EnergyTasksService {
  private _taskListProxy: () => Array<IChargeTask>
  private _taskListRepo: EntityRepository<ChargeTaskEntity>

  constructor(
    config: ConfigService,
    private readonly _log: LoggerService,
    private readonly _em: EntityManager,
  ) {
    this._taskListRepo = this._em.getRepository(ChargeTaskEntity)
    ChargeTask.config = config.get<BatteryConfig>('batteryConfig')
    this._taskListProxy = config.createProxy<Array<IChargeTask>>('taskList')
    this.loadTaskListFromDbAndConfig()
    config.on('reloaded', () => this.loadTaskListFromDbAndConfig())
  }

  async loadTaskListFromDbAndConfig() {
    const em = this._em.fork()
    const taskListRepo = em.getRepository(ChargeTaskEntity)
    const from = subHours(new Date(), 12)
    const taskList = await taskListRepo.find({ till: { $gt: from } })
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
    const [error, allTasks] = await tryit(taskListRepo.find)(
      { from: { $gt: since } },
      { orderBy: { from: 'asc' } },
    )
    if (error) {
      this._log.error(error.message, 'a391e', error)
      return []
    }
    return allTasks
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
}
