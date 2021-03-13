import middy from '@middy/core'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import { deleteSociety } from './db'

// should be first middleware
const setCorrelationId = () => ({
  before: (handler: any, next: middy.NextFunction) => {
    const correlationId = uuidv4()
    logger.setCorrelationId(correlationId)
    handler.event.correlationId = correlationId
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
    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }

    if (!event.pathParameters || !event.pathParameters.society_id) {
      throw HttpError(400, 'missing society id')
    }

    if (!event.pathParameters.society_id.match(/^[\w-]+$/)) {
      throw HttpError(404, 'not found')
    }

    await deleteSociety(event.pathParameters.society_id)

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
      body: JSON.stringify({ error: e.message || 'Something went wrong' }),
    }
    return response
  } finally {
    logger.info({ ...response, response_time: Date.now() - requestStartTime })
  }
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
