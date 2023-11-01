import { ConsoleLogger, ConsoleLoggerOptions, Injectable, Scope } from '@nestjs/common'
import { format } from 'date-fns-tz'
import { appendFile } from 'fs/promises'
import { TZ_OPTIONS } from '@src/helpers/time.helpers'

const eol = '\r\n'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor()
  constructor(context: string)
  constructor(context: string, options: ConsoleLoggerOptions)
  constructor(context?: string, options?: ConsoleLoggerOptions) {
    super(context, options)
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(message, ...optionalParams)
    this.print(process.env.LOG_FILE_PATH, message, optionalParams)
  }

  error(message: any, ...optionalParams: any[]) {
    super.error(message, ...optionalParams)
    this.print(process.env.ERROR_LOG_FILE_PATH, message, optionalParams)
  }

  warn(message: any, ...optionalParams: any[]) {
    super.warn(message, ...optionalParams)
  }

  debug(message: any, ...optionalParams: any[]) {
    if (process.env.PRINT_DEBUG_LOGS === 'true') super.debug(message, ...optionalParams)
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (process.env.PRINT_VERBOSE_LOGS === 'true') super.verbose(message, ...optionalParams)
  }

  setContext(context: string) {
    super.context = context
  }

  async print(path: string, message: string, params: any[]) {
    if (path) {
      const time = format(new Date(), 'HH:mm:ss d/MM', TZ_OPTIONS)
      await appendFile(path, time + ' - ' + message + eol)
      for await (const param of params) {
        await appendFile(path, JSON.stringify(param) + eol)
      }
    }
  }
}
