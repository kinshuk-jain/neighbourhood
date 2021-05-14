import pino from 'pino'

class EnhancedLogger {
  cid?: string
  logger: any

  constructor() {
    this.logger = this.createLogger()
  }

  setCorrelationId(correlationId: string) {
    this.cid = correlationId
  }

  createLogger() {
    return pino({
      redact: {
        paths: ['*.Authorization'],
        censor: '******',
      },
    })
  }

  info(event: any) {
    this.logger.info(event, { correlation_id: this.cid })
  }

  warn(event: any) {
    this.logger.warn(event, { correlation_id: this.cid })
  }

  debug(event: any) {
    this.logger.debug(event, { correlation_id: this.cid })
  }

  error(event: any) {
    this.logger.error(event, { correlation_id: this.cid })
  }
}

const logger = new EnhancedLogger()

export default logger
