import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { sendLoginCredsEmail } from './loginEmail'
import { validate } from 'jsonschema'
import schema from './emailRequestSchema.json'
import logger from './logger'
import { decryptedEnv } from './getDecryptedEnvs'
import { v4 as uuidv4 } from 'uuid'

const USER_NAMES: { [key: string]: string } = {
  user_data: 'USER_DATA_SERVICE_TOKEN',
  society_mgmt: 'SOCIETY_MGMT_SERVICE_TOKEN',
  authentication: 'AUTHENTICATION_SERVICE_TOKEN',
}

const templateNameToFuncMapping: { [key: string]: Function } = {
  'login-email': sendLoginCredsEmail,
  'create-society-request': () => ({}),
  'delete-user': () => ({}),
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
    } else {
      logger.setCorrelationId(event.headers['Correlation-Id'])
    }
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.AUTHENTICATION_SERVICE_TOKEN) {
      await Promise.race([
        decryptedEnv,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

    // first-login template
    // delete-user template
    // blacklist-user template
    // unblacklist-user template
    // make-admin template
    // remove-admin template
    // email-change template
    // society-created email
    // create-society-request received
    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Basic')) {
      throw HttpError(401, 'unauthorized')
    }

    // verify basic auth and get scope from token
    const token = authToken.split(' ')[1]
    const [user = '', pass] = Buffer.from(token, 'base64')
      .toString('ascii')
      .split(':')

    if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
      throw HttpError(401, 'unauthorized')
    }

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

    await templateNameToFuncMapping[template](recipients, params, subject)

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
