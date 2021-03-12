// FE generates a code_verifier and code_challenge

import middy from '@middy/core'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import schema from './authorizeSchema.json'
import { validate } from 'jsonschema'
import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import {
  getUserData,
  saveAuthCode,
  updateUserData,
  removeAuthCode,
  getAliasData,
} from './db'
import querystring from 'querystring'

// TODO: need to have a hosted page with this redirect link
const redirect_link = 'https://neightbourhood.com/auth/oauth/redirect'

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

const validScopes = ['alles', 'sysalles', 'profile']

const myHandler: APIGatewayProxyHandler = async (
  event: any
): Promise<APIGatewayProxyResult> => {
  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)
    if (event.requestContext.httpMethod.toUpperCase() === 'POST') {
      const { valid, errors } = validate(event.queryStringParameters, schema)
      if (!valid) {
        throw HttpError(400, 'missing required parameters', {
          missing_params: errors.map((error) => ({
            property: error.property,
            message: error.message,
            name: error.name,
          })),
        })
      }

      const {
        response_type,
        state,
        scope,
        code_challenge,
        code_challenge_method,
        alias,
      } = event.queryStringParameters
      let email = event.queryStringParameters.email

      if (
        response_type.toLowerCase() !== 'code' ||
        !scope ||
        !code_challenge ||
        code_challenge_method !== 'S256'
      ) {
        throw HttpError(400, 'request has invalid params')
      }

      if (!email && !alias) {
        throw HttpError(400, 'email or alias missing')
      }

      if (!email && alias) {
        email = (await getAliasData(alias)).email
      }

      const userData = await getUserData(email)

      if (!userData || !/(.+)@([\w-]+){2,}\.([a-z]+){2,}/.test(email)) {
        throw HttpError(400, 'invalid user data')
      }

      const allowedScopes = scope
        .split(' ')
        .filter((scope: string) => validScopes.includes(scope))

      if (!allowedScopes.length) {
        throw HttpError(400, 'invalid scopes')
      }

      const scopeString = allowedScopes.join(' ')

      const authCode = uuidv4()
      if (userData.auth_code) {
        await removeAuthCode(email, userData.auth_code)
      }

      await saveAuthCode({
        code: authCode,
        code_challenge,
        code_challenge_method,
        email,
        scope: scopeString,
      })

      await updateUserData(email, 'auth_code', authCode)

      const link = `https://${redirect_link}/?${querystring.stringify({
        code: authCode,
        scope: scopeString,
        state,
        email,
      })}`

      // TODO: send an email with this link
    } else {
      // GET /authorize does not exist as we do not need a
      // separte consent page for the user for now
      throw HttpError(404, 'not found')
    }
    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'success', message: 'blah blah' }),
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

// TODO: allow user to update alias
// TODO: set access level

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
