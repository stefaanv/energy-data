import { Controller, Get } from '@nestjs/common'
import { PricingService } from './pricing.service'
import { subHours } from 'date-fns'

@Controller('pricing')
export class PricingController {
  constructor(private readonly _pricingService: PricingService) {}

  @Get()
  async getPricing() {
    const since = subHours(new Date(), 8)
    return this._pricingService.getBelpexSince(since)
  }

  @Get('load')
  async getLoadPricing() {
    this._pricingService.loadIndexData()
    return 'Pricing info loaded from spot guru'
  }
}
