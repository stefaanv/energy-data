import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core'
import { Index } from './index.entity'

@Entity({ tableName: 'index-values' })
export class IndexValue {
  @PrimaryKey({ columnType: 'timestamp' })
  startTime!: Date

  @ManyToOne(() => Index)
  index!: Index
}
