// import { ConfigService } from '@itanium.be/nestjs-dynamic-config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { prompt } from 'inquirer'
import { commandRootQuestions } from './inquirer-questions/command-root'
import { emitKeypressEvents } from 'readline'
import { LoggerService } from './logger.service'
import { getPort } from 'get-port-please'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const START_PORT = 3000

async function bootstrap() {
  // set up the application and logging
  const logger = new LoggerService('main')
  const app = await NestFactory.create(AppModule, { cors: true })
  app.setGlobalPrefix('api')
  app.enableCors({ origin: '*' })

  // // Activate the command console (if needed)
  // const activateKeyWatcher = config.get('activateCommandKeyWatcher', false)
  // if (activateKeyWatcher) setKeyWatcher()

  // Start listening for REST API calls
  const port = await getPort({ portRange: [3000, 3010] })
  app.listen(port)
  logger.log(`Listening on port ${port}`)
  logger.verbose('VERBOSE LOG EXAMPLE')
  logger.debug('DEBUG LOG EXAMPLE')

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

// async function bootstrap2() {
//   const url = 'http://homeassistant.local:8123/api/services/huawei_solar/stop_forcible_charge'
//   const data = { device_id: 'd36a4ede8885b40373c9b4d100e7f139' }
//   const bearer =
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0YjFmY2EyOWU5ZWU0NTJiYmRiNTY4MjNkZjJhNWRkNCIsImlhdCI6MTY5NTc1MDk2MSwiZXhwIjoyMDExMTEwOTYxfQ.YUn0PYL8xc2kpE9yGI1N2NK9SGkkAVEFm1mf9QT5DI8'

//   const options = { headers: { Authorization: `Bearer ${bearer}` } }
//   const result = await axios.post(url, data, options)
//   console.log(result.data)
// }

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
