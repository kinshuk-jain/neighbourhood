import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import logger from './logger'
import schema from './updateSocietySchema.json'
import { updateSocietyRecord } from './db'

import { v4 as uuidv4 } from 'uuid'

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

const HttpError = (status: number, message: string): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  return e
}

const myHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info(event)

    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }

    if (!event.body) {
      throw HttpError(401, 'missing body')
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

    if (
      !event.pathParameters ||
      !event.pathParameters.proxy ||
      !event.pathParameters.proxy.match(/^[\w-]+\/[\w-]+\/?([\?#].*)?$/)
    ) {
      throw HttpError(404, 'not found')
    }

    let route_path = event.pathParameters.proxy.match(/^\/?([\w-]+\/[\w-]+)\/?/)
    // this line should not throw as we have already verified url
    const route_path_tokens = (route_path || [])[1].split('/')

    // tutorial_finished - /id/tutorial,
    // is_blacklisted - /id/blacklist,
    // name - /id/name,
    // admins - /id/admin/(add|remove),
    // address - /id/address,
    // imp_contacts - /id/contact/(add|remove),
    // directory: [] - /id/member/(add|remove),
    // show_directory - /id/show-directory,
    // verified: false - /id/verified,

    await updateSocietyRecord()

    const response = {
      isBase64Encoded: false,
      statusCode: 400,
      body: JSON.stringify({ status: 'success', message: 'record updated' }),
    }
    logger.info(response)
    return response
  } catch (e) {
    const response = {
      isBase64Encoded: false,
      statusCode: e.statusCode || 500,
      body: JSON.stringify({ error: e.message || 'Something went wrong' }),
    }
    logger.info(response)
    return response
  }
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
  .use(jsonBodyParser())
