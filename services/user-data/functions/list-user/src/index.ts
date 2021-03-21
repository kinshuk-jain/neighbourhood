import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import logger from './logger'
import { validate } from 'jsonschema'
import schema from './listUserSchema.json'
import {
  listUsersNotApproved,
  listUsersEmailNotVerified,
  listUsersBySociety,
  listUsersInRegion,
  listUsersBlacklisted,
} from './db'

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
    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }

    const { valid, errors } = validate(event.queryStringParameters, schema)

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
      filter,
      value,
      page_size = 20,
      page_number = 1,
    } = event.queryStringParameters

    if (!/^[\w-]$+/i.test(filter) || (value && !/^[\w-.=;]+$/i.test(value))) {
      throw HttpError(400, 'invalid filter value in query param')
    }

    let pageSize, pageNumber
    try {
      pageSize = parseInt(page_size)
      pageNumber = parseInt(page_number)
    } catch (e) {
      throw new Error('page_size or page_number not an integer')
    }

    if (pageSize < 20) {
      throw new Error('page size less than 20 now allowed')
    } else if (pageSize > 200) {
      throw new Error('page size more than 200 not allowed')
    } else if (pageNumber < 1) {
      throw new Error('page number less than 1 not allowed')
    }

    let responseBody

    switch (filter) {
      case 'society':
        // check user privilege
        responseBody = await listUsersBySociety(value, pageNumber, pageSize)
        break
      case 'pending_approval':
        // check admin privilege
        responseBody = await listUsersNotApproved(pageNumber, pageSize)
        break
      case 'blacklisted':
        // check admin privilege
        responseBody = await listUsersBlacklisted(pageNumber, pageSize)
        break
      case 'pending_email_verification':
        // check admin privilege
        responseBody = await listUsersEmailNotVerified(pageNumber, pageSize)
        break
      case 'postal_code':
        // check admin privilege
        responseBody = await listUsersInRegion(value, pageNumber, pageSize)
        break
      default:
        throw HttpError(400, 'invalid filter')
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
