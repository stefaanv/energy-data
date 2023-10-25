import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core'
import { ChargeMode, ChargeModeValues, IChargeTask } from 'src/shared-models/charge-task.interface'

@Entity({ tableName: 'charge-tasks' })
export class ChargeTaskEntity implements IChargeTask {
  @PrimaryKey({ columnType: 'int', autoincrement: true })
  id!: number

  @Enum(() => ChargeModeValues)
  mode!: ChargeMode

  @Property()
  from!: Date

  @Property()
  till!: Date

  @Property({ columnType: 'real' })
  power: number

  @Property({ columnType: 'real', nullable: true })
  target?: number

  @Property({ columnType: 'real', nullable: true })
  holdOff?: number
}
