import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import { v4 as uuidv4 } from 'uuid'
import logger from './logger'
import { verifyToken } from './verifyAuthToken'
import schema from './createContactSchema.json'
import { createContact } from './db'

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

    if (!event.pathParameters || !event.pathParameters.society_id) {
      throw HttpError(404, 'not found')
    }

    if (!event.pathParameters.society_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(404, 'not found')
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { blacklisted, user_id, scope: serializedScope } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    const scope = JSON.parse(serializedScope)

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    const { society_id } = event.pathParameters

    // only society admin can create a contact
    if (!scope || scope[society_id] !== 'admin') {
      throw HttpError(404, 'not found')
    }

    if (blacklisted) {
      throw HttpError(403, 'User blacklisted. Cannot create contact')
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

    if (!/^[a-zA-Z0-9-,\s\/]{2,60}$/i.test(event.body.address.street_address)) {
      throw HttpError(400, 'invalid street address')
    } else if (!/^[\w-\s]{2,40}$/i.test(event.body.address.state)) {
      throw HttpError(400, 'invalid state')
    } else if (!/^[\w-\s]{2,40}$/i.test(event.body.address.city)) {
      throw HttpError(400, 'invalid city')
    } else if (!/^[\w-\s]{2,40}$/i.test(event.body.address.country)) {
      throw HttpError(400, 'invalid country')
    } else if (!/^[0-9-\s]{4,8}$/.test(event.body.address.postal_code)) {
      throw HttpError(400, 'invalid postal code')
    } else if (
      !/^[a-zA-Z0-9-]{2,20}\s?[a-zA-Z0-9-]{0,20}$/.test(event.body.first_name)
    ) {
      throw HttpError(400, 'invalid first name')
    } else if (
      !/^[a-zA-Z0-9-]{2,20}\s?[a-zA-Z0-9-]{0,20}$/.test(event.body.last_name)
    ) {
      throw HttpError(400, 'invalid last name')
    } else if (!/^(\+[0-9]{2,3}(-|\s))?[0-9]{6,18}$/.test(event.body.phone)) {
      throw HttpError(400, 'invalid phone')
    } else if (!event.body.category || !event.body.category.length) {
      throw HttpError(400, 'invalid contact category')
    }

    const contact = await createContact(society_id, event.body)

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'successfully created contact',
        data: contact,
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
