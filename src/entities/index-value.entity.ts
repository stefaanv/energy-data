import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Index } from './index.entity'

@Entity({ tableName: 'index-values' })
export class IndexValue {
  @PrimaryKey({ columnType: 'timestamp' })
  startTime!: Date

  @Property({ columnType: 'varchar' })
  hrTime!: string

  @ManyToOne(() => Index, { primary: true })
  index!: Index

  @Property({ columnType: 'timestamp' })
  endTime!: Date

  @Property({ columnType: 'real' })
  price!: number
}
