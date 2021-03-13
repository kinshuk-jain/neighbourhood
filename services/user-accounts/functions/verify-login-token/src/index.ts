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

// TODO: signout function

import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { validate } from 'jsonschema'
import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import authCodeSchema from './authorizationCodeGrantSchema.json'
import refreshTokenSchema from './refreshTokenGrantSchema.json'
import {
  getAuthCodeData,
  removeAuthCode,
  saveDataInRefreshTokenTable,
} from './db'
import { createHash } from 'crypto'
import { createAccessToken, createRefreshToken } from './token'

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

/**
 * POST /token endpoint which uses auth_code/access_token to get access_token/other tokens
 */

const myHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)
    const queryParams = event.queryStringParameters
    if (!queryParams || !queryParams.grant_type) {
      throw HttpError(400, 'missing params')
    }

    if (queryParams.grant_type.toLowerCase() === 'refresh_token') {
      const { valid, errors } = validate(queryParams, refreshTokenSchema)
      if (!valid) {
        throw HttpError(400, 'missing required parameters', {
          missing_params: errors.map((error) => ({
            property: error.property,
            message: error.message,
            name: error.name,
          })),
        })
      }
      /**
       * Grant_type (refresh_token)
       * Can be called with access_token: If token expired and refresh token valid, return a new access token
       * if token expired and refresh also expired, return error.
       * if token not expired, return token
       */
      response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    } else if (queryParams.grant_type.toLowerCase() === 'authorization_code') {
      const { valid, errors } = validate(queryParams, authCodeSchema)
      if (!valid) {
        throw HttpError(400, 'missing required parameters', {
          missing_params: errors.map((error) => ({
            property: error.property,
            message: error.message,
            name: error.name,
          })),
        })
      }

      const { email, code = '', code_verifier = '', scope } = queryParams

      if (!code_verifier) {
        throw HttpError(401, 'invalide code_verifier')
      }

      const {
        code: storedCode,
        code_challenge,
        code_challenge_method,
        email: storedEmail,
        scope: storedScope,
        expiry_time,
      } = await getAuthCodeData(code)

      if (!storedCode) {
        throw HttpError(401, 'invalid authorization code')
      }

      if (Date.now() >= expiry_time) {
        throw HttpError(401, 'expired authorization code')
      }

      if (email !== storedEmail) {
        throw HttpError(401, 'authorization code does not belong to this user')
      }

      if (
        code_challenge !==
        createHash(code_challenge_method)
          .update(code_verifier, 'utf-8')
          .digest('hex')
      ) {
        throw HttpError(401, 'invalid code_verifier')
      }

      await removeAuthCode(code)

      const accessToken = await createAccessToken(email)
      const refreshToken = await createRefreshToken()

      // set refresh token in refresh token table
      await saveDataInRefreshTokenTable({
        token: refreshToken,
        email,
      })

      // TODO: set email verified in user table if not set

      response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: '',
          refresth_token_expires_in: '',
        }),
      }
    } else {
      throw HttpError(400, 'invalid grant type')
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
