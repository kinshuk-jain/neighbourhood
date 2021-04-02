import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import logger from './logger'
import { getDetails, getDetailsByEmail, getDetailsByAlias } from './db'
import { decryptedEnv } from './getDecryptedEnvs'

// map of usernames to their password keys - allowed to access this service
const USER_NAMES: { [key: string]: string } = {
  authentication: 'AUTHENTICATION_SERVICE_TOKEN',
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
    // wait for resolution for 1s
    if (!process.env.AUTHENTICATION_SERVICE_TOKEN) {
      await Promise.race([
        decryptedEnv,
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

    // allow auth to access this
    logger.info(event)
    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }

    if (authToken.startsWith('Basic')) {
      // verify basic auth and get scope from token
      const token = authToken.split(' ')[1]
      const [user = '', pass] = Buffer.from(token, 'base64')
        .toString('ascii')
        .split(':')

      if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
        throw HttpError(401, 'unauthorized')
      }
    } else if (authToken.startsWith('Bearer')) {
      // decode token
    } else {
      throw HttpError(401, 'unauthorized')
    }

    if (!event.body) {
      throw HttpError(400, 'missing body')
    }

    const { id_type = '', id_value = '' } = JSON.parse(event.body)

    let responseBody
    if (id_type.toLowerCase() === 'user_id') {
      if (!/^[\w-]{5,40}$/.test(id_value)) {
        throw HttpError(400, 'invalid user id')
      }
      responseBody = await getDetails(id_value)
    } else if (id_type.toLowerCase() === 'email') {
      if (!/^([\w-]+){2,40}@([\w-]+){2,}\.([a-z]+){2,}$/.test(id_value)) {
        throw HttpError(400, 'invalid email value')
      }
      responseBody = await getDetailsByEmail(id_value)
    } else if (id_type.toLowerCase() === 'alias') {
      if (!/^[\w-]{5,40}$/.test(id_value)) {
        throw HttpError(400, 'invalid alias value')
      }
      responseBody = await getDetailsByAlias(id_value)
    } else {
      throw HttpError(400, 'invalid id_type')
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        data: responseBody,
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
