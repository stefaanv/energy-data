import { ConfigModule } from '@itanium.be/nestjs-dynamic-config'
import { ConsoleLogger, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DrizzleModule } from './drizzle/drizzle.module'

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.register({
      configFile: 'configuration/config.js',
      logger: new ConsoleLogger(),
      debug: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
