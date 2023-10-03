// import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { NestFactory } from '@nestjs/core'
import { InquirerService } from 'nest-commander'
import { AppModule } from './app.module'
import * as inquirer from 'inquirer'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.listen(3000)
  while (true) {
    await sleep(10)
    console.log()
    const answer = await inquirer.prompt({
      name: 'confirm',
      type: 'confirm',
      message: "Please confirm that you'd like to XXX",
    })
    console.log(answer)
  }
}
bootstrap()
