import logger from './logger'
import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import { deleteUser, getUserData } from './db'
import { decryptedEnv } from './getDecryptedEnvs'
import axios from 'axios'
import { verifyToken } from './verifyAuthToken'
import { config, ENV } from './config'

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

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.COMMS_API_KEY) {
      await Promise.race([
        decryptedEnv,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    const { blacklisted, user_id: accessTokenUserId, scope } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    if (!accessTokenUserId) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (!event.pathParameters || !event.pathParameters.user_id) {
      throw HttpError(404, 'not found')
    }

    const user_id = event.pathParameters.user_id

    if (!user_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(404, 'not found')
    }

    if (
      (blacklisted || ['admin', 'user'].includes(scope)) &&
      accessTokenUserId !== user_id
    ) {
      throw HttpError(403, 'not allowed')
    }

    const userData = await getUserData(user_id)

    await deleteUser(user_id)
    try {
      const { status } = await axios.post(
        `${config[ENV].comms_domain}/comms/email/send`,
        {
          template: 'delete-user',
          recipients: [userData.email],
          subject: 'Account deleted',
          params: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          },
        },
        {
          timeout: 10000, // 10s timeout
          auth: {
            username: 'user_data',
            password: process.env.COMMS_API_KEY || '',
          },
        }
      )

      if (status < 200 || status >= 300) {
        logger.info(`Could not send email while deleting user: ${user_id}`)
      }
    } catch (e) {}

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'successfully deleted user',
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
