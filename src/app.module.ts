import { ConfigModule } from '@itanium.be/nestjs-dynamic-config'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { configValidationSchema } from './config-validator.joi'
import { LoggerService } from './logger.service'
import { BatteryMonitorService } from './battery-monitor.service'
import { ScheduleModule } from '@nestjs/schedule'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'
import { PricingService } from './pricing.service'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { ServeStaticModule } from '@nestjs/serve-static'
import { resolve } from 'path'

// Db tables updaten: https://mikro-orm.io/docs/schema-generator
//npx mikro-orm schema:update --run (werkt niet !)
const clientPath = resolve(__dirname, '..', 'client')
console.log('clientPath', clientPath)
@Module({
  imports: [
    ConfigModule.register({
      configFile: 'configuration/config.js',
      logger: new LoggerService(),
      debug: false,
      validationSchema: configValidationSchema,
      validationOptions: { allowUnknown: true },
    }),
    ScheduleModule.forRoot(),
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: './db/sqlite.db',
      type: 'sqlite',
      autoLoadEntities: true,
      debug: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: clientPath,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    BatteryMonitorService,
    HomeAssistantCommuncationService,
    PricingService,
  ],
  exports: [LoggerService, ConfigModule],
})
export class AppModule {}
