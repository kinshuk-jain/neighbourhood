import logger from './logger'
import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import schema from './updateSchema.json'
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
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.AUTHENTICATION_API_KEY) {
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

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }

    let accessScope = '',
      userId

    if (authToken.startsWith('Basic')) {
      // verify basic auth and get scope from token
      const token = authToken.split(' ')[1]
      const [user = '', pass] = Buffer.from(token, 'base64')
        .toString('ascii')
        .split(':')

      if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
        throw HttpError(401, 'unauthorized')
      }
      // TODO: check the scope
      accessScope = 'sysadmin'
    } else if (authToken.startsWith('Bearer')) {
      // decode token
      const { blacklisted, user_id, scope } =
        (await verifyToken(authToken.split(' ')[1])) || {}

      if (!user_id) {
        throw HttpError(
          500,
          'internal service error: error decoding access token'
        )
      }
      if (blacklisted) {
        throw HttpError(403, 'user blacklisted, not allowed')
      }
      accessScope = scope
      userId = user_id
    } else {
      throw HttpError(401, 'unauthorized')
    }

    const { valid, errors } = validate(event.body, schema)
    if (!valid) {
      throw HttpError(400, 'body missing required parameters', {
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      })
    }

    // allow this to access auth and comms

    // update user phone - just update it
    // profile thumbnail - just update it
    // update show phone - just update it
    // update post login - just update it
    // update alias - just update it
    // update report - just update it and if number of reports becomes more than 10, we flag the user for super admin to check
    // update user email verified status - just update it
    // first login - just update it
    // update user black list status - send email and signout if refresh_token is present after making call to auth
    // update user scope - can only be promoted to admin or demoted to user, send email on scope update and signout if refresh_token is present after making call to auth
    // society list - remove society id from the list jsut update it. Adding is more complex not clear how to do it
    // update user address
    // update email
    // update user approval status

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'successfully logged out',
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
  .use(jsonBodyParser())
