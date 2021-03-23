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
  getDirectory,
  getContacts,
  getStatus,
  getVerificationStatus,
  getAllMembers,
} from './db'

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
    // TODO: if user is blacklisted, he/she cannot read a society

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

    let route_path = event.pathParameters.proxy.match(/^\/?([\w-]+)\/?/)
    // this line should not throw as we have already verified url
    const route_path_tokens = (route_path || [])[1].split('/')
    let responseBody
    if (route_path_tokens[0] === 'contacts') {
      // return imp contacts of society
      responseBody = getContacts(society_id)
    } else if (route_path_tokens[0] === 'directory') {
      // return directory of society if show_directory is true
      responseBody = getDirectory(society_id)
    } else if (route_path_tokens[0] === 'address') {
      // return address of society
      responseBody = getAddress(society_id)
    } else if (route_path_tokens[0] === 'name') {
      // return name of society
      responseBody = getName(society_id)
    } else if (route_path_tokens[0] === 'blacklist') {
      // admin privilege
      // return blacklist status of society
      responseBody = getStatus(society_id)
    } else if (route_path_tokens[0] === 'invoice') {
      // admin privilege
      // return invoice of society
      responseBody = getInvoice(society_id)
    } else if (route_path_tokens[0] === 'admins') {
      // admin privilege
      // return admins of society
      responseBody = getAdmins(society_id)
    } else if (route_path_tokens[0] === 'verification') {
      // admin privilege
      // return verification status of society
      responseBody = getVerificationStatus(society_id)
    } else if (route_path_tokens[0] === 'members') {
      // admin privilege
      // return all users of our app in this society
      responseBody = getAllMembers(society_id)
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
