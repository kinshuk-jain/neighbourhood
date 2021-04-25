import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { validate } from 'jsonschema'
import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import authCodeSchema from './authorizationCodeGrantSchema.json'
import refreshTokenSchema from './refreshTokenGrantSchema.json'
import {
  getAuthCodeData,
  removeAuthCode,
  saveDataInRefreshTokenTable,
  getRefreshTokenData,
  deleteRefreshToken,
  updateRefreshTokenDataOnAccessToken,
  updateUserInfoOnLogin,
} from './db'
import { createHash, publicDecrypt } from 'crypto'
import { createAccessToken, createRefreshToken } from './token'
import { decryptedEnv } from './getDecryptedEnvs'

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

const myHandler: APIGatewayProxyHandler = async (
  event: any,
  context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.PVT_KEY) {
      await Promise.race([
        decryptedEnv,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

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

      if (
        !queryParams.refresh_token ||
        !/^[\w-]{2,50}$/i.test(queryParams.refresh_token)
      ) {
        throw HttpError(400, 'invalid refresh token')
      }

      if (!queryParams.user_id || !/^[\w-]{5,40}$/i.test(queryParams.user_id)) {
        throw HttpError(400, 'invalid user_id')
      }

      const {
        token,
        user_id: stored_user_id,
        expiry_time,
        times_used,
        revoked,
        last_used_on,
        scope,
        for_blacklisted_user,
      } = await getRefreshTokenData(queryParams.refresh_token)

      if (
        !token ||
        revoked ||
        Date.now() >= expiry_time ||
        stored_user_id !== queryParams.user_id
      ) {
        throw HttpError(401, 'invalid refresh token')
      }

      if (
        times_used > 38000 || // with 15m expiry of access token refresh token should ideally not be used more than 35040 times
        (last_used_on && Date.now() - last_used_on < 60) // a refresh token can only be used once per min
      ) {
        await deleteRefreshToken(token)
        throw HttpError(401, 'refresh token used too many times')
      }

      await updateRefreshTokenDataOnAccessToken({
        token,
        times_used: times_used + 1,
        last_used_on: Date.now(),
        ip_address: event.requestContext.http.sourceIp,
        user_agent: event.headers['User-Agent'],
      })

      response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          access_token: await createAccessToken(
            queryParams.user_id,
            scope,
            for_blacklisted_user
          ),
          expires_in: 900, // 15min
        }),
      }
      logger.info({
        status_code: 200,
        response_time: Date.now() - requestStartTime,
      })
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
      // user id can also be alias
      const { code, code_verifier, user_id, is_alias } = queryParams

      if (!user_id || !/^[\w-]{5,40}$/i.test(user_id)) {
        throw HttpError(400, 'invalid user_id')
      }

      if (!code || !/^[\w-]{2,40}$/i.test(code)) {
        throw HttpError(400, 'invalid code')
      }

      if (!code_verifier) {
        throw HttpError(401, 'missing code_verifier')
      }

      const {
        code: storedCode,
        code_challenge,
        code_challenge_method,
        user_id: stored_user_id,
        expiry_time,
        scope,
        for_blacklisted_user,
      } = await getAuthCodeData(code)

      if (!storedCode) {
        throw HttpError(401, 'invalid authorization code')
      }

      if (Date.now() >= expiry_time) {
        throw HttpError(401, 'expired authorization code')
      }

      if (user_id !== stored_user_id) {
        throw HttpError(401, 'authorization code does not belong to this user')
      }

      if (code_challenge_method === 'RS512') {
        // decrypt the encryptedRandomString using public key
        // get PUBKEY from user_id as user_id is alias in this case
        // user_id = user_id returned by querying alias
        // const decrypted = publicDecrypt(PUBKEY, Buffer.from(code_challenge, 'base64'));
        // if (decrypted !== code_verifier) { throw 'error' }
      } else if (
        code_challenge !==
        createHash(code_challenge_method)
          .update(code_verifier, 'utf-8')
          .digest('hex')
      ) {
        throw HttpError(401, 'invalid code_verifier')
      }

      await removeAuthCode(code)

      const accessToken = await createAccessToken(
        user_id,
        scope,
        for_blacklisted_user
      )
      const refreshToken = await createRefreshToken()

      await saveDataInRefreshTokenTable({
        token: refreshToken,
        user_id,
        scope,
        for_blacklisted_user,
        ip_address: event.requestContext.http
          ? event.requestContext.http.sourceIp
          : '',
        user_agent: event.headers['User-Agent'],
      })

      await updateUserInfoOnLogin({
        user_id,
        ip_address: event.requestContext.http
          ? event.requestContext.http.sourceIp
          : '',
        user_agent: event.headers['User-Agent'],
      })

      response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 900, // 15min
          refresh_token_expires_in: 31536000, // 365 days
        }),
      }
      logger.info({
        status_code: 200,
        response_time: Date.now() - requestStartTime,
      })
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
        status: 'failure',
        error: e.message || 'Something went wrong',
        ...(e.body ? { body: e.body } : {}),
      }),
    }
    logger.info({ ...response, response_time: Date.now() - requestStartTime })
    return response
  }
}

export const handler = middy(myHandler)
  .use(setCorrelationId())
  .use(errorHandler())
  .use(jsonBodyParser())
