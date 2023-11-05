import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'quarterly' })
export class QuarterlyEntity {
  @PrimaryKey({ columnType: 'timestamp' })
  startTime!: Date

  @Property({ columnType: 'varchar' })
  hrTime!: string

  @Property({ columnType: 'real', nullable: true, default: null })
  /** in Wh*/
  gridConsumed: number

  @Property({ columnType: 'real', nullable: true, default: null })
  /** in Wh*/
  gridProduced: number

  @Property({ columnType: 'real', nullable: true, default: null })
  /** in Wh*/
  houseConsumed: number

  @Property({ columnType: 'real', nullable: true, default: null })
  /** in Wh*/
  solarProduced: number

  @Property({ columnType: 'real', nullable: true, default: null })
  /** in Wh*/
  batteryCharged: number

  @Property({ columnType: 'real', nullable: true, default: null })
  /** in Wh*/
  batteryDischarged: number

  @Property({ columnType: 'real' })
  /** in Wh*/
  batterySoc: number
}
