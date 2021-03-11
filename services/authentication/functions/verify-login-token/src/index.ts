// implements /token endpoint

// when user clicks the link, he is redirected to hosted redirect page which requests /token endpoint
// with auth code and code_verifier. We verify details and issue access, refresh and id tokens
// refresh token is saved on BE while access and id tokens are returned
// FE saves access token, uses id token to verify
// When access_token is expired, a user sends access_token to get back a new access_token if
// refresh_token is not expired. If refresh token is nearing expiration, we can issue new
// refresh token as well and store it in BE
// if a user logs in from another device he goes through exact same flow. Thus a user can
// have multiple access/refresh tokens with 1:1 mapping

// user table - access level, user_id, alias, redirect_uri, access_tokens, refresh tokens, time realted fields,
// access-token-table - access-token, access_level, refresh_token, user_id, revoked, time related fields, device, ip
// refresh token table - refresh-token, user-id, device, ip, time related into, access-token, revoked

import middy from '@middy/core'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import logger from './logger'
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

/**
 * POST /token endpoint which uses auth_code/access_token to get access_token/other tokens
 */

const myHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)
    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }
    // set email verified in user table somehow
  } catch (e) {}
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
