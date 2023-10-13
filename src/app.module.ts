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
import { join } from 'path'

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
      dbName: 'energy-data',
      type: 'sqlite',
      autoLoadEntities: true,
      debug: true,
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
