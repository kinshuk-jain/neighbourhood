import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import logger from './logger'
import { validate } from 'jsonschema'
import { verifyToken } from './verifyAuthToken'
import schema from './listContactsSchema.json'
import { getContactsInSociety, getContactsInRegion } from './db'

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
    const { user_id, scope: serializedScope } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    const { valid, errors } = validate(event.queryStringParameters, schema)

    if (!valid) {
      throw HttpError(400, 'query params missing required parameters', {
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      })
    }

    const scope = JSON.parse(serializedScope)

    // this checks if user has permission to access the society
    if (!scope[event.pathParameters.society_id] && scope.root !== true) {
      throw HttpError(404, 'Not found')
    }

    const {
      filter,
      value,
      page_size = 20,
      page_number = 1,
    } = event.queryStringParameters

    if (!/^[\w-]+$/i.test(filter) || (value && !/^[\w-.=;]+$/i.test(value))) {
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

    let contacts: Record<string, any>[] = []

    switch (filter) {
      case 'category':
        contacts = await getContactsInSociety(
          event.pathParameters.society_id,
          pageNumber,
          pageSize,
          value
        )
        break
      case 'postal_code':
        // value is postal_code;category
        if (!value) {
          throw HttpError(400, 'invalid value for filter')
        }
        const [postal_code, category] = value.split(';')
        if (!postal_code || !category) {
          throw HttpError(400, 'invalid value for filter')
        }
        contacts = await getContactsInRegion(
          postal_code,
          pageNumber,
          pageSize,
          category
        )
        break
      default:
        contacts = await getContactsInSociety(
          event.pathParameters.society_id,
          pageNumber,
          pageSize
        )
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        data: contacts,
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
