import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { Injectable } from '@nestjs/common'
import { LoggerService } from '../logger.service'
import { EntityManager, FilterQuery } from '@mikro-orm/core'
import { IndexValue } from '@src/entities/index-value.entity'
import { QuarterlyEntity } from '@src/entities/quarterly'

@Injectable()
export class QueryService {
  constructor(private readonly _em: EntityManager) {}

  async getPricing(from?: Date, till?: Date): Promise<IndexValue[]> {
    let andClause: FilterQuery<IndexValue> = { $and: [] }
    if (from) andClause.$and.push({ startTime: { $gt: from } })
    if (till) andClause.$and.push({ startTime: { $lt: till } })
    if (andClause.$and.length === 0) andClause = {}
    return this._em.find(IndexValue, andClause)
  }

  async getQuarterlyValues(from?: Date, till?: Date): Promise<QuarterlyEntity[]> {
    let andClause: FilterQuery<QuarterlyEntity> = { $and: [] }
    if (from) andClause.$and.push({ startTime: { $gt: from } })
    if (till) andClause.$and.push({ startTime: { $lt: till } })
    if (andClause.$and.length === 0) andClause = {}
    return this._em.find(QuarterlyEntity, andClause)
  }
}
