import { ConsoleLogger, ConsoleLoggerOptions, Injectable, Scope } from '@nestjs/common'
import { appendFileSync } from 'fs'

const LOG_FILE_PATH = '../application.log'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor()
  constructor(context: string)
  constructor(context: string, options: ConsoleLoggerOptions)
  constructor(context?: string, options?: ConsoleLoggerOptions) {
    super(context, options)
  }
  log(message: any, ...optionalParams: any[]) {
    appendFileSync(LOG_FILE_PATH, message)
    super.log(message, ...optionalParams)
  }

  error(message: any, ...optionalParams: any[]) {
    super.error(message, ...optionalParams)
  }

  warn(message: any, ...optionalParams: any[]) {
    super.warn(message, ...optionalParams)
  }

  debug(message: any, ...optionalParams: any[]) {
    super.debug(message, ...optionalParams)
  }

  verbose(message: any, ...optionalParams: any[]) {
    super.verbose(message, ...optionalParams)
  }

  setContext(context: string) {
    super.context = context
  }
}
