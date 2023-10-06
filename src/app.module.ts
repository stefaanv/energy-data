import { ConfigModule } from '@itanium.be/nestjs-dynamic-config'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { configValidationSchema } from './config-validator.joi'
import { DrizzleModule } from './drizzle/drizzle.module'
import { LoggerService } from './logger.service'

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.register({
      configFile: 'configuration/config.js',
      logger: new LoggerService(),
      debug: true,
      validationSchema: configValidationSchema,
      validationOptions: { allowUnknown: true },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, LoggerService],
  exports: [LoggerService],
})
export class AppModule {}
