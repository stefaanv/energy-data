import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common'
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
    const [error, result] = await this._pricingService.loadIndexData()
    if (error) {
      return new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    } else return result
  }
}
