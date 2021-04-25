import middy from '@middy/core'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import {
  getAdmins,
  getName,
  getInvoice,
  getAddress,
  getContacts,
  getStatus,
  getVerificationStatus,
  getDetails,
} from './db'
import { verifyToken } from './verifyAuthToken'
import { decryptedEnv } from './getDecryptedEnvs'

// map of usernames to their password keys - allowed to access this service
const USER_NAMES: { [key: string]: string } = {
  user_data: 'USER_DATA_SERVICE_TOKEN',
}

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

    let isServiceRequest = false
    let accessScope: Record<string, any> = {},
      userId = ''

    if (authToken.startsWith('Basic')) {
      // wait for resolution for 1s
      if (!process.env.USER_DATA_SERVICE_TOKEN) {
        await Promise.race([
          decryptedEnv,
          new Promise((_, reject) => {
            setTimeout(() => {
              reject('internal error: env vars not loaded')
            }, 1000)
          }),
        ])
      }

      // verify basic auth and get scope from token
      const token = authToken.split(' ')[1]
      const [user = '', pass] = Buffer.from(token, 'base64')
        .toString('ascii')
        .split(':')

      if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
        throw HttpError(401, 'unauthorized')
      }
      isServiceRequest = true
    } else if (authToken.startsWith('Bearer')) {
      // decode token
      const { blacklisted, user_id, scope } =
        (await verifyToken(authToken.split(' ')[1])) || {}

      if (!user_id) {
        throw HttpError(
          500,
          'internal service error: error decoding access token'
        )
      }
      if (blacklisted) {
        throw HttpError(403, 'user blacklisted, not allowed')
      }
      accessScope = JSON.parse(scope)
      userId = user_id
    } else {
      throw HttpError(401, 'unauthorized')
    }

    if (
      !event.pathParameters ||
      !event.pathParameters.society_id ||
      !event.pathParameters.proxy ||
      !event.pathParameters.proxy.match(/^\/?[\w-]+\/?([\?#].*)?$/)
    ) {
      throw HttpError(404, 'not found')
    }

    const society_id = event.pathParameters.society_id

    if (!society_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(404, 'not found')
    }

    if (
      !isServiceRequest &&
      accessScope.root !== true &&
      !accessScope[society_id]
    ) {
      throw HttpError(404, 'not found')
    }

    const checkAdminPrivilege = (scope: Record<string, any>) => {
      if (
        !isServiceRequest &&
        scope.root !== true &&
        scope[society_id] !== 'admin'
      )
        throw HttpError(403, 'not allowed')
    }

    let route_path = event.pathParameters.proxy.match(/^\/?([\w-]+)\/?/)
    // this line should not throw as we have already verified url
    const route_path_tokens = (route_path || [])[1].split('/')
    let responseBody
    if (route_path_tokens[0] === 'contacts') {
      // return imp contacts of society
      responseBody = await getContacts(society_id)
    } else if (route_path_tokens[0] === 'address') {
      // return address of society
      responseBody = await getAddress(society_id)
    } else if (route_path_tokens[0] === 'name') {
      // return name of society
      responseBody = await getName(society_id)
    } else if (route_path_tokens[0] === 'details') {
      // return details of society like type, name, address for now
      checkAdminPrivilege(accessScope)
      responseBody = await getDetails(society_id)
    } else if (route_path_tokens[0] === 'blacklist') {
      // admin privilege
      checkAdminPrivilege(accessScope)
      // return blacklist status of society
      responseBody = await getStatus(society_id)
    } else if (route_path_tokens[0] === 'invoice') {
      // admin privilege
      checkAdminPrivilege(accessScope)
      // return invoice of society
      responseBody = await getInvoice(society_id)
    } else if (route_path_tokens[0] === 'admins') {
      // admin privilege
      checkAdminPrivilege(accessScope)
      // return admins of society
      responseBody = await getAdmins(society_id)
    } else if (route_path_tokens[0] === 'verification') {
      // admin privilege
      checkAdminPrivilege(accessScope)
      // return verification status of society
      responseBody = await getVerificationStatus(society_id)
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
