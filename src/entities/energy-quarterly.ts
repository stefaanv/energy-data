import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'quarterly' })
export class QuarterlyEntity {
  @PrimaryKey({ columnType: 'timestamp' })
  startTime!: Date

  @Property({ columnType: 'real' })
  /** in Wh*/
  consumed: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  produced: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  monthlyPeak: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  batterySoc: number
}
