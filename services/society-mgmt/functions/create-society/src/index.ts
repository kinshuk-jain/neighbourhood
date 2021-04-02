import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import { APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import logger from './logger'
import schema from './createSocietySchema.json'
import { addSocietyRecord } from './db'
import axios from 'axios'

const config: { [key: string]: any } = {
  development: {
    comms_domain: 'http://localhost:3000',
  },
  staging: {
    comms_domain: 'http://localhost:3000',
  },
  production: {
    comms_domain: 'http://localhost:3000',
  },
}

const ENV = process.env.ENVIRONMENT || 'development'

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

const myHandler: APIGatewayProxyHandler = async (
  event: {
    [key: string]: any
  },
  context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }
    // get user id from authToken
    const user_id = '1231231'
    // TODO: if user is blacklisted, he/she cannot create a society

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

    const {
      name,
      address,
      society_type,
      show_directory = true,
      user_email,
      user_first_name,
      user_last_name,
    } = event.body

    if (!/^[\w-]{5,60}$/i.test(name)) {
      throw HttpError(400, 'society name invalid or too big')
    } else if (!/^[a-zA-Z0-9-,\/]{2,60}$/i.test(address.street_address)) {
      throw HttpError(400, 'invalid street address')
    } else if (!/^[\w-]{2,40}$/i.test(address.state)) {
      throw HttpError(400, 'invalid state')
    } else if (!/^[\w-]{2,40}$/i.test(address.city)) {
      throw HttpError(400, 'invalid city')
    } else if (!/^[\w-]{2,40}$/i.test(address.country)) {
      throw HttpError(400, 'invalid country')
    } else if (!/^[0-9]{4,8}$/.test(address.postal_code)) {
      throw HttpError(400, 'invalid postal code')
    }

    // on create, we must verify society name, address and admin manually.
    await addSocietyRecord({
      admins: [user_id],
      name,
      user_id,
      address,
      society_type,
      show_directory,
    })

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'success', message: 'society created' }),
    }

    // send email to admin that society creating request is accepted
    const { status } = await axios.post(
      `${config[ENV].comms_domain}/comms/email/send`,
      {
        template: 'create-society-request',
        recipients: [user_email],
        subject: 'Society creation request accepted',
        params: {
          first_name: user_first_name,
          last_name: user_last_name,
        },
      },
      {
        timeout: 10000, // 10s timeout
        auth: {
          username: 'society_mgmt',
          password: process.env.COMMS_API_KEY || '',
        },
      }
    )

    if (status < 200 || status >= 300) {
      logger.info(`Could not send email while deleting user: ${user_id}`)
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
