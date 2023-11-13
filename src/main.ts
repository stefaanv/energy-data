// import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { LoggerService } from './logger.service'
import { getPort } from 'get-port-please'
import { MikroORM } from '@mikro-orm/sqlite'
import ormConfig from '@src/mikro-orm.config'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const START_PORT = 3000

async function bootstrap() {
  // set up the application and logging
  const logger = new LoggerService('main')
  const app = await NestFactory.create(AppModule, { cors: true })
  app.setGlobalPrefix('api')
  app.enableCors({ origin: '*' })

  // Run DB migrations
  console.log(ormConfig)
  const orm = await MikroORM.init({
    ...ormConfig,
    type: 'sqlite',
    migrations: {
      path: 'dist/migrations',
      pathTs: 'src/migrations',
    },
  })
  const migrator = orm.getMigrator()
  await migrator.up()

  // Start listening for REST API calls
  const port = await getPort({ portRange: [3000, 3010] })
  app.listen(port)
  logger.log(`Listening on port ${port}`)
}
bootstrap()
