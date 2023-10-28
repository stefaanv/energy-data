import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'quarterly' })
export class QuarterlyEntity {
  @PrimaryKey({ columnType: 'timestamp' })
  startTime!: Date

  @Property({ columnType: 'varchar' })
  hrTime!: string

  @Property({ columnType: 'real' })
  /** in Wh*/
  gridConsumed: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  gridProduced: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  monthlyPeak: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  batterySoc: number
}
