import logger from './logger'
import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import { updateUserScope } from './db'
import { decryptedEnv } from './getDecryptedEnvs'

// map of usernames to their password keys - allowed to access this service
const USER_NAMES: { [key: string]: string } = {
  user_data: 'USER_DATA_SERVICE_TOKEN',
}

// should be first middleware
const setCorrelationId = () => ({
  before: (handler: any, next: middy.NextFunction) => {
    if (!handler.event.headers['Correlation-Id']) {
      const correlationId = uuidv4()
      logger.setCorrelationId(correlationId)
      handler.event.headers['Correlation-Id'] = correlationId
    }
    next()
  },
})

// should be second middleware
const errorHandler = () => ({
  onError: (handler: any, next: middy.NextFunction) => {
    let response = {}
    if (handler.error.statusCode && handler.error.message) {
      response = {
        statusCode: handler.error.statusCode,
        body: JSON.stringify({ error: handler.error.message }),
      }
    }
    response = {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unkonwn error' }),
    }
    handler.response = {
      ...response,
      isBase64Encoded: false,
      headers: {
        'content-type': 'application/json',
      },
    }
    logger.info(handler.response)
    return next()
  },
})

const HttpError = (status: number, message: string, body?: object): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.USER_DATA_SERVICE_TOKEN) {
      await Promise.race([
        decryptedEnv,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Basic ')) {
      throw HttpError(401, 'unauthorized')
    }

    const token = authToken.split(' ')[1]
    const [user = '', pass] = Buffer.from(token, 'base64')
      .toString('ascii')
      .split(':')

    if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
      throw HttpError(401, 'unauthorized')
    }

    if (!event.body) {
      throw HttpError(400, 'missing body')
    }

    const { user_id, scope_type, scope_value } = JSON.parse(event.body)

    if (!/^[\w-]{5,40}$/.test(user_id)) {
      throw HttpError(400, 'invalid user id')
    }

    if (!/[\w-]+/.test(scope_type) || !/[\w-]+/.test(scope_value)) {
      throw HttpError(400, 'invalid scope value or type')
    }

    await updateUserScope(user_id, scope_type, scope_value)

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'successfully updated',
      }),
    }
    return response
  } catch (e) {
    response = {
      isBase64Encoded: false,
      statusCode: e.statusCode || 500,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'failure',
        error: e.message || 'Something went wrong',
        ...(e.body ? { body: e.body } : {}),
      }),
    }
    return response
  } finally {
    logger.info({ ...response, response_time: Date.now() - requestStartTime })
  }
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
