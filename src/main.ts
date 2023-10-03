// import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { prompt, Question } from 'inquirer'
import { commandRootQuestions } from './inquirer-questions/command-root'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.listen(3000)
  while (true) {
    await sleep(10)
    console.log()
    const answer = await prompt(commandRootQuestions)
    console.log(answer)
  }
}
bootstrap()
