import { ConfigModule } from '@itanium.be/nestjs-dynamic-config'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { configValidationSchema } from './config-validator.joi'
import { DrizzleModule } from './drizzle/drizzle.module'
import { LoggerService } from './logger.service'
import { BatteryMonitorService } from './battery-monitor.service'
import { ScheduleModule } from '@nestjs/schedule'
import { HomeAssistantCommuncationService } from './home-assistant-communication.service'

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.register({
      configFile: 'configuration/config.js',
      logger: new LoggerService(),
      debug: false,
      validationSchema: configValidationSchema,
      validationOptions: { allowUnknown: true },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, LoggerService, BatteryMonitorService, HomeAssistantCommuncationService],
  exports: [LoggerService],
})
export class AppModule {}
