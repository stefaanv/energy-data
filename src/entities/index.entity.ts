import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core'
import { IndexValue } from './index-value.entity'

@Entity({ tableName: 'index' })
export class Index {
  @PrimaryKey({ columnType: 'int', autoincrement: true })
  id!: number

  @Property()
  name!: string

  @OneToMany(() => IndexValue, value => value.index)
  values = new Collection<IndexValue>(this)
}
