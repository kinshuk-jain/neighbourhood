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

const myHandler: APIGatewayProxyHandler = async (event: {
  [key: string]: any
}): Promise<APIGatewayProxyResult> => {
  const requestStartTime = Date.now()
  let response
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
      throw HttpError(400, 'body missing required parameters', {
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      })
    }

    const {
      tutorial_finished = false,
      is_blacklisted = false,
      name,
      user_id,
      admins,
      imp_contacts = [],
      address,
      society_type,
      show_directory = true,
    } = event.body

    // TODO: validate whether the society is valid with google address api for right society type
    // sjpuld also store lat/long bounds of society
    await addSocietyRecord({
      tutorial_finished,
      is_blacklisted,
      admins: admins || [user_id],
      imp_contacts,
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

    return response
  } catch (e) {
    response = {
      isBase64Encoded: false,
      statusCode: e.statusCode || 500,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
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
