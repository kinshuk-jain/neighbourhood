import logger from 'service-common/logger'
import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import { addUserAlias, removeUserAlias } from './db'
import { verifyToken } from './verifyAuthToken'

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

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { user_id } = (await verifyToken(authToken.split(' ')[1])) || {}

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (!/^[\w-]{5,40}$/.test(user_id)) {
      throw HttpError(400, 'invalid user id')
    }

    if (!event.body) {
      throw HttpError(400, 'missing body')
    }

    const body = JSON.parse(event.body)

    if (event.requestContext.http.method === 'POST') {
      // add alias
      if (
        !body.alias ||
        typeof body.alias !== 'string' ||
        !body.imei ||
        typeof body.imei !== 'string' ||
        !body.public_key ||
        typeof body.public_key !== 'string'
      ) {
        throw HttpError(400, 'invalid request body')
      }
      await addUserAlias(body.alias, user_id, body.imei, body.public_key)
    } else if (event.requestContext.http.method === 'DELETE') {
      // remove alias
      if (!body.alias || typeof body.alias !== 'string') {
        throw HttpError(400, 'invalid alias')
      }
      await removeUserAlias(body.alias)
    } else {
      throw HttpError(404, 'not found')
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
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
