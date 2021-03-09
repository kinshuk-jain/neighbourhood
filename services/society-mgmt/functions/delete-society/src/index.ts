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
    let response
    if (handler.error.statusCode && handler.error.message) {
      response = {
        isBase64Encoded: false,
        statusCode: handler.error.statusCode,
        body: JSON.stringify({ error: handler.error.message }),
      }
    }
    response = {
      statusCode: 500,
      isBase64Encoded: false,
      body: JSON.stringify({ error: 'Unkonwn error' }),
    }
    handler.response = response
    logger.info(response)
    return next()
  },
})

const myHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info(event)
  const authToken = event.headers['Authorization']

  if (!authToken) {
    const response = {
      isBase64Encoded: false,
      statusCode: 401,
      body: JSON.stringify({ error: 'unauthorized' }),
    }
    logger.info(response)
    return response
  }

  if (!event.pathParameters || !event.pathParameters.society_id) {
    const response = {
      isBase64Encoded: false,
      statusCode: 400,
      body: JSON.stringify({ error: 'missing society id' }),
    }
    logger.info(response)
    return response
  }

  if (!event.pathParameters.society_id.match(/^[\w-]+$/)) {
    const response = {
      isBase64Encoded: false,
      statusCode: 400,
      body: JSON.stringify({ error: 'improper society id' }),
    }
    logger.info(response)
    return response
  }

  await deleteSociety(event.pathParameters.society_id)

  const response = {
    isBase64Encoded: false,
    statusCode: 400,
    body: JSON.stringify({ status: 'success', message: 'society deleted' }),
  }
  logger.info(response)
  return response
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
