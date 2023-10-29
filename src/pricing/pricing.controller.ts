import { Controller, Get, Inject, Param } from '@nestjs/common'
import { EntityManager } from '@mikro-orm/core'
import { PricingService } from './pricing.service'
import { subHours } from 'date-fns'

@Controller('pricing')
export class PricingController {
  constructor(
    private readonly _pricingService: PricingService,
    private readonly _em: EntityManager,
  ) {}

  @Get()
  async getPricing() {
    const since = subHours(new Date(), 2)
    return this._pricingService.getBelpexSince(since)
  }

  @Get('load')
  async getLoadPricing() {
    this._pricingService.loadIndexData()
    return 'Pricing info loaded from spot guru'
  }
}
