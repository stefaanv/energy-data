import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { IChargeTask as FeChargeTask } from './energy-actions/charge-task.interface'
import { differenceInDays } from 'date-fns'
import { OptionsWithTZ, format } from 'date-fns-tz'

@Injectable()
export class EnergyServiceOld {
  // private _chargeTasks: ChargeTask[]
  private _tzOptions: OptionsWithTZ

  constructor(config: ConfigService) {
    this._tzOptions = { timeZone: config.get<string>('timeZone', 'Europe/Brussels') }
    // this._chargeTasks = [
    //   {
    //     id: 1,
    //     from: 21 / 24,
    //     mode: 'charge',
    //     power: 2000,
    //     till: 23.5 / 24,
    //     date: new Date(),
    //   },
    // ]
  }

  // getEnergyTasks(): FeChargeTask[] {
  //   const today = new Date()
  //   return this._chargeTasks.map(bct => {
  //     return {
  //       id: bct.id,
  //       dateRelative: differenceInDays(bct.from, today),
  //       from: format(bct.from, 'HH:mm', this._tzOptions),
  //       till: format(bct.from, 'HH:mm', this._tzOptions),
  //       mode: bct.mode,
  //       power: bct.power,
  //     } as FeChargeTask
  //   })
  // }

  // upsertEnergyTasks(feTask: FeChargeTask) {
  //   const today = new Date()
  //   const id = feTask.id
  //   const index = this._chargeTasks.findIndex(t => t.id === id)
  //   if (index >= 0) {
  //     const task = (this._chargeTasks[index] = feTask)
  //   }
  //   return this._chargeTasks.map(bct => {
  //     return {
  //       id: bct.id,
  //       dateRelative: differenceInDays(today, bct.from),
  //       from: format(bct.from, 'HH:mm', this._tzOptions),
  //       till: format(bct.from, 'HH:mm', this._tzOptions),
  //       mode: bct.mode,
  //       power: bct.power,
  //     } as FeChargeTask
  //   })
  // }
}
