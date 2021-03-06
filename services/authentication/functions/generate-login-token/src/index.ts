// FE generates a r code_verifier and code_challenge
// code_verifier is a 32 char random utf8 string which is sha256-ed in hex encoding to
// create code_challenge
import middy from '@middy/core'
import querystring from 'querystring'
import axios from 'axios'
import { randomBytes, publicDecrypt } from 'crypto'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { validate } from 'jsonschema'
import { v4 as uuidv4 } from 'uuid'
import schema from './authorizeSchema.json'
import {
  getUserDataFromEmail,
  saveAuthCode,
  removeAuthCode,
  getUserDataFromAlias,
  getDataFromAlias,
} from './db/methods'
import logger from 'service-common/logger'
import { decryptedEnv } from 'service-common/getDecryptedEnvs'
import { ENV, config } from './config'
import { IAuthUserData } from './interfaces'
// TODO: do we need to have a hosted page with this redirect link??
const redirect_link = config[ENV].redirect_link

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

const encryptedEnvironmentVariableNames =
  process.env.ENVIRONMENT === 'development'
    ? []
    : ['COMMS_API_KEY', 'USER_DATA_API_KEY']

const decryptedEnvPromise = decryptedEnv(
  logger,
  encryptedEnvironmentVariableNames
)

const myHandler: APIGatewayProxyHandler = async (
  event: any,
  context: any
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    await Promise.race([
      decryptedEnvPromise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject('internal error: env vars not loaded')
        }, 1000)
      }),
    ])

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

    if (!/[\w-]{2,30}/i.test(alias)) {
      throw HttpError(400, 'invalid alias')
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
      code_challenge = '',
      code_challenge_method = '',
      encrypted_verifier,
    } = event.queryStringParameters

    if (
      response_type.toLowerCase() !== 'code' ||
      !code_challenge ||
      !/^[\w-]+$/.test(code_challenge) ||
      code_challenge_method !== 'S256'
    ) {
      throw HttpError(400, 'request has invalid params')
    }
    let userData: IAuthUserData
    let isAliasAuth = false

    if (!email && alias) {
      isAliasAuth = true
      userData = await getUserDataFromAlias(alias)
    } else if (email) {
      // note: if called after signup this needs strong consistency
      userData = await getUserDataFromEmail(email)
    } else {
      throw HttpError(400, 'bad request')
    }

    let user_id
    if (!userData) {
      throw HttpError(404, 'user not found')
    } else {
      user_id = userData.user_id
    }

    // if (userData.is_blacklisted) {
    //   throw HttpError(401, 'user blacklisted')
    // }

    // randomBytes uses libuv thread pool
    const authCode = randomBytes(32).toString('base64')
    if (userData.auth_code) {
      await removeAuthCode(userData.auth_code)
    }

    if (isAliasAuth) {
      // encrypted_verifier is imei:curent_time:random_string encrypted with pvt key on user device and then result is base64 encoded
      if (!encrypted_verifier) {
        throw HttpError(404, 'not found')
      }

      const { imei, pub_key } = await getDataFromAlias(alias)
      // decrypt the encrypted_verifier using public key
      const decrypted = publicDecrypt(
        pub_key,
        Buffer.from(encrypted_verifier, 'base64')
      ).toString('utf-8')
      const decrypted_verifier = decrypted.split(':')
      if (
        decrypted_verifier[0] !== imei ||
        Date.now() - parseInt(decrypted_verifier[1]) > 5 * 60 * 1000
      ) {
        throw HttpError(401, 'invalid encrypted_verifier')
      }
    }

    await saveAuthCode({
      code: authCode,
      code_challenge,
      code_challenge_method: 'sha256',
      user_id,
      scope: userData.scope,
      for_blacklisted_user: userData.is_blacklisted,
    })

    if (!isAliasAuth) {
      const link = `https://${redirect_link}/?${querystring.stringify({
        code: authCode,
        scope: userData.scope,
        state,
        user_id,
        first_login: userData.first_login,
      })}`

      const { status, data } = await axios.post(
        `${config[ENV].comms_domain}/comms/email/send`,
        {
          template: 'login-email',
          recipients: [userData.email],
          subject: 'Log in to Neighbourhood',
          params: {
            link,
            first_name: userData.first_name,
            last_name: userData.last_name,
          },
        },
        {
          timeout: 10000, // 10s timeout
          auth: {
            username: 'authentication',
            password: process.env.COMMS_API_KEY || '',
          },
        }
      )

      if (status < 200 || status >= 300) {
        throw HttpError(500, 'Could not send email', data.data)
      }
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: isAliasAuth
          ? {
              code: authCode,
              scope: userData.scope,
              state,
              user_id,
              first_login: userData.first_login,
            }
          : 'email sent',
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
