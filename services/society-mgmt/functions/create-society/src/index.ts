import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import { APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import logger from './logger'
import schema from './createSocietySchema.json'
import { addSocietyRecord } from './db'

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

const myHandler: APIGatewayProxyHandler = async (event: {
  [key: string]: any
}): Promise<APIGatewayProxyResult> => {
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

  if (!event.body) {
    const response = {
      isBase64Encoded: false,
      statusCode: 400,
      body: JSON.stringify({ error: 'missing body' }),
    }
    logger.info(response)
    return response
  }

  const { valid, errors } = validate(event.body, schema)

  if (!valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'body missing required parameters',
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      }),
      isBase64Encoded: false,
    }
  }

  const {
    tutorial_finished = false,
    is_blacklisted = false,
    name,
    user_id,
    admins,
    imp_contacts = [],
    address,
  } = event.body

  await addSocietyRecord({
    tutorial_finished,
    is_blacklisted,
    admins: admins || [user_id],
    imp_contacts,
    name,
    user_id,
    address,
  })

  const response = {
    isBase64Encoded: false,
    statusCode: 200,
    body: JSON.stringify({ status: 'success', message: 'society created' }),
  }

  logger.info(response)

  return response
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
  .use(jsonBodyParser())
