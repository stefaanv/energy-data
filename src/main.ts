// import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { prompt } from 'inquirer'
import { commandRootQuestions } from './inquirer-questions/command-root'
import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { emitKeypressEvents } from 'readline'
import { LoggerService } from './logger.service'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function bootstrap() {
  // set up the application and logging
  const logger = new LoggerService('main')
  const app = await NestFactory.create(AppModule, { logger })

  // get some configuration items
  const config = app.get(ConfigService)

  // // Activate the command console (if needed)
  // const activateKeyWatcher = config.get('activateCommandKeyWatcher', false)
  // if (activateKeyWatcher) setKeyWatcher()

  // Start listening for REST API calls
  app.listen(3000)

  // // de/re-activate the keywatcher if config is altered
  // config.on('reloaded', () => {
  //   if (config.get('activateCommandKeyWatcher', false)) {
  //     setKeyWatcher()
  //   } else {
  //     removeKeyWatcher()
  //   }
  // })
}
bootstrap()

//TODO! keyListener gedoen naar aparte klasse verhuizen
const listener = async (key: string, data: any) => {
  if (data.ctrl === true && data.name === 'c') {
    removeKeyWatcher()
    process.exit()
  }
  if (data.name === 'return') {
    process.stdin.removeListener('keypress', listener)
    process.stdin.setRawMode(false)
    while (true) {
      console.log()
      // Command function
      const answer = await prompt(commandRootQuestions)
      console.log(answer)
      console.log()
    }
  }
}

async function setKeyWatcher() {
  await sleep(100)
  console.log(`Press the 'enter' key to enter command mode`)
  emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.on('keypress', listener)
}

function removeKeyWatcher() {
  console.log(`=-=-= keywatcher removed =-=-=`)
  process.stdin.removeListener('keypress', listener)
  process.stdin.setRawMode(false)
}
