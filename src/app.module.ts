import { ConfigModule } from '@itanium.be/nestjs-dynamic-config'
import { ConsoleLogger, Module } from '@nestjs/common'
import { CommandRunnerModule } from 'nest-commander'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DrizzleModule } from './drizzle/drizzle.module'
import { CommandSequenceQuestions } from './inquirer-questions/commands'
import { PersonInfoQuestions } from './inquirer-questions/person-info-example'

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.register({
      configFile: 'configuration/config.js',
      logger: new ConsoleLogger(),
      debug: true,
    }),
    CommandRunnerModule.forModule(),
  ],
  controllers: [AppController],
  providers: [AppService, CommandSequenceQuestions],
})
export class AppModule {}
