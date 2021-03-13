import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { sendLoginCredsEmail } from './loginEmail'
import { validate } from 'jsonschema'
import schema from './emailRequestSchema.json'
import logger from './logger'

import { v4 as uuidv4 } from 'uuid'

const templateNameToFuncMapping: { [key: string]: Function } = {
  'login-email': sendLoginCredsEmail,
}

const HttpError = (status: number, message: string, body?: object): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response

  try {
    if (!event.headers['Correlation-Id']) {
      const correlationId = uuidv4()
      logger.setCorrelationId(correlationId)
      event.headers['Correlation-Id'] = correlationId
    }
    logger.info(event)

    if (!event.body) {
      throw HttpError(400, 'body missing in request')
    }

    if (!event.pathParameters || event.pathParameters.proxy !== 'send') {
      throw HttpError(404, 'not found')
    }

    const body = JSON.parse(event.body)
    const { template, params, recipients, subject } = body

    const { valid, errors } = validate(body, schema)

    if (!valid) {
      throw HttpError(400, 'body missing required parameters', {
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      })
    }

    if (!templateNameToFuncMapping[template]) {
      throw HttpError(400, 'invalid template name')
    }

    await templateNameToFuncMapping[template](params.link, recipients)

    response = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
      isBase64Encoded: false,
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
