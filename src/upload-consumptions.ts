import { LoggerService } from './logger.service'
import { MikroORM } from '@mikro-orm/sqlite'
import ormConfig from '@src/mikro-orm.config'
import { last } from 'radash'

async function main(args: string[]) {
  // set up the application and logging
  const logger = new LoggerService('main')
  const orm = await MikroORM.init({
    ...ormConfig,
    type: 'sqlite',
  })
  const fileName = last(args)
  console.log(fileName)
  await orm.close()
}
main(process.argv)
