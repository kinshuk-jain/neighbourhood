import middy from '@middy/core'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import { deleteSociety, updateSocietyPendingDeletionStatus } from './db'
import { decryptedEnv } from './getDecryptedEnvs'
import { verifyToken } from './verifyAuthToken'

export const config: { [key: string]: any } = {
  development: {
    comms_domain: 'http://localhost:3000',
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  staging: {
    comms_domain: 'http://localhost:3000',
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
  production: {
    comms_domain: 'http://localhost:3000',
    auth_domain: 'http://localhost:3000',
    my_domain: 'http://localhost:3000',
  },
}

export const ENV = process.env.ENVIRONMENT || 'development'
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

const HttpError = (status: number, message: string): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  return e
}

const myHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.COMMS_API_KEY) {
      await Promise.race([
        decryptedEnv,
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { blacklisted, user_id, scope } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (blacklisted) {
      throw HttpError(403, 'User blacklisted. Cannot delete society')
    }

    if (!event.pathParameters || !event.pathParameters.society_id) {
      throw HttpError(400, 'missing society id')
    }

    if (!event.pathParameters.society_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(404, 'not found')
    }

    // if sysadmin delete, if admin mark it for deletion
    if (scope === 'sysadmin') {
      await deleteSociety(event.pathParameters.society_id, user_id)
      // TODO: send push notification to all society members
    } else if (scope === 'admin') {
      await updateSocietyPendingDeletionStatus(
        event.pathParameters.society_id,
        user_id
      )
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'success', message: 'society deleted' }),
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
