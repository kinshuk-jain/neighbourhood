// FE generates a r code_verifier and code_challenge
// code_verifier is a 32 char random utf8 string which is sha256-ed in hex encoding to
// create code_challenge

import middy from '@middy/core'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import schema from './authorizeSchema.json'
import { validate } from 'jsonschema'
import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import { getUserData, saveAuthCode, removeAuthCode, getAliasData } from './db'
import querystring from 'querystring'
import { randomBytes } from 'crypto'

const config: { [key: string]: any } = {
  staging: {
    redirect_link: '',
  },
  development: {
    redirect_link: 'http://localhost:3000/auth/oauth/redirect',
  },
  production: {
    redirect_link: '',
  },
}

// TODO: need to have a hosted page with this redirect link
const redirect_link =
  config[process.env.ENVIRONMENT || 'development'].redirect_link

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

const HttpError = (status: number, message: string, body?: object): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}

const validScopes = ['admin', 'sysadmin', 'user']

const myHandler: APIGatewayProxyHandler = async (
  event: any,
  context: any
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)
    if (event.requestContext.httpMethod.toUpperCase() === 'POST') {
      if (!event.body) {
        throw HttpError(400, 'missing required parameters')
      }

      const { alias, email } = JSON.parse(event.body)

      if (!email && !alias) {
        throw HttpError(400, 'email or alias missing')
      }

      if (email && !/(.+)@([\w-]+){2,}\.([a-z]+){2,}/i.test(email)) {
        throw HttpError(400, 'invalid email')
      }

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
      } = event.queryStringParameters

      if (
        response_type.toLowerCase() !== 'code' ||
        !scope ||
        !code_challenge ||
        code_challenge_method !== 'S256'
      ) {
        throw HttpError(400, 'request has invalid params')
      }
      let user_id

      if (!email && alias) {
        user_id = (await getAliasData(alias.toLowerCase())).user_id
      }
      // note: if called after signup this needs strong consistency
      const userData = await getUserData(email.toLowerCase())

      if (!userData) {
        throw HttpError(400, 'invalid user data')
      } else {
        user_id = userData.user_id
      }

      if (userData.is_blacklisted) {
        throw HttpError(401, 'user blacklisted')
      }

      const allowedScopes = scope
        .split(' ')
        .filter(
          (scope: string) =>
            validScopes.includes(scope) && userData.scope.includes(scope)
        )

      if (!allowedScopes.length) {
        throw HttpError(400, 'invalid scopes')
      }

      const scopeString = allowedScopes.join(' ')

      // randomBytes uses libuv thread pool
      const authCode = randomBytes(32).toString('base64')
      if (userData.auth_code) {
        await removeAuthCode(userData.auth_code)
      }

      await saveAuthCode({
        code: authCode,
        code_challenge,
        code_challenge_method: 'sha256',
        user_id,
        scope: scopeString,
      })

      const link = `https://${redirect_link}/?${querystring.stringify({
        code: authCode,
        scope: scopeString,
        state,
        user_id,
        first_login: userData.first_login,
      })}`

      // TODO: send an email with this link
    } else {
      throw HttpError(404, 'not found')
    }
    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'success', message: 'email sent' }),
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

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
