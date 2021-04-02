import logger from './logger'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { v4 as uuidv4 } from 'uuid'
import { validate } from 'jsonschema'
import schema from './signupSchema.json'
import { createNewUser, findUser } from './db'
import { decryptedEnv } from './getDecryptedEnvs'

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

    logger.info(event)

    if (!event.body) {
      throw HttpError(401, 'missing body')
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

    if (
      !event.body.society_id ||
      !event.body.email ||
      !event.body.first_name ||
      !event.body.last_name ||
      !event.body.phone ||
      !event.body.address ||
      !event.body.address.city ||
      !event.body.address.state ||
      !event.body.address.street_address ||
      !event.body.address.postal_code
    ) {
      throw HttpError(400, 'request missing required params')
    } else if (
      !/^([\w-]+){2,40}@([\w-]+){2,}\.([a-z]+){2,}$/.test(event.body.email)
    ) {
      throw HttpError(400, 'email invalid or too big')
    } else if (
      !/^[a-zA-Z0-9-]{2,40}$/i.test(event.body.first_name) ||
      !/^[a-zA-Z0-9-]{2,40}$/i.test(event.body.first_name)
    ) {
      throw HttpError(400, 'invalid name or too big')
    } else if (!/^[0-9]{4,8}$/.test(event.body.address.postal_code)) {
      throw HttpError(400, 'invalid postal code')
    } else if (!/^\+?[0-9]{6,15}$/.test(event.body.phone)) {
      throw HttpError(400, 'invalid phone')
    } else if (
      !/^[a-zA-Z0-9-,\/]{2,60}$/i.test(event.body.address.street_address)
    ) {
      throw HttpError(400, 'invalid street address')
    } else if (!/^[\w-]{2,40}$/i.test(event.body.address.state)) {
      throw HttpError(400, 'invalid state')
    } else if (!/^[\w-]{2,40}$/i.test(event.body.address.city)) {
      throw HttpError(400, 'invalid city')
    } else if (!/^[\w-]{2,40}$/i.test(event.body.address.country)) {
      throw HttpError(400, 'invalid country')
    }

    const userAlreadyExists = await findUser(event.body.email)

    if (userAlreadyExists) {
      throw HttpError(400, 'user already exists')
    }

    const user_id = await createNewUser({
      ...event.body,
    })

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'user created',
        user_id,
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
