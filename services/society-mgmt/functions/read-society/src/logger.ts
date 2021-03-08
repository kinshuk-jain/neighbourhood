import * as winston from 'winston'

// helper to mask any sensitive data in logs
export const maskLog = (logs: any) => {
  //   if (typeof logs.message === 'object' && logs.message.event) {
  //   }
  return logs
}

const maskRewriter = winston.format(maskLog)

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
    return winston.createLogger({
      transports: [
        new winston.transports.Console({
          format:
            process.env.ENVIRONMENT === 'development'
              ? winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.simple(),
                  winston.format.prettyPrint(),
                  winston.format.colorize({
                    all: true,
                  })
                )
              : winston.format.combine(
                  maskRewriter(),
                  winston.format.timestamp(),
                  winston.format.json()
                ),
        }),
      ],
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
