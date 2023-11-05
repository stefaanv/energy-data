import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common'
import { QueryService } from './query.service'
import { parse } from 'date-fns'

@Controller('db')
export class QueryController {
  constructor(private readonly _queryService: QueryService) {}

  @Get('pricing')
  async getPricing(@Query('from') from?: string, @Query('till') till?: string) {
    const _from = from ? parse(from, 'd-M-yyyy', new Date()) : undefined
    const _till = till ? parse(till, 'd-M-yyyy', new Date()) : undefined
    return this._queryService.getPricing(_from, _till)
  }

  @Get('quarter')
  async getLoadPricing(@Query('from') from?: string, @Query('till') till?: string) {
    const _from = from ? parse(from, 'd-M-yyyy', new Date()) : undefined
    const _till = till ? parse(till, 'd-M-yyyy', new Date()) : undefined

    return this._queryService.getQuarterlyValues(_from, _till)
  }
}
