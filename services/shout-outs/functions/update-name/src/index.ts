import { HttpError } from './error'
import logger from './logger'
import middy from '@middy/core'
import { setCorrelationId, errorHandler } from './middlewares'
import { updateUserName } from './db'
import { decryptedEnv } from './getDecryptedEnvs'

// map of usernames to their password keys - allowed to access this service
const USER_NAMES: { [key: string]: string } = {
  user_data: 'USER_DATA_SERVICE_TOKEN',
}

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

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

    if (
      !event.pathParameters ||
      !event.pathParameters.user_id ||
      !event.pathParameters.user_id.match(/^[\w-]{5,40}$/) ||
      !event.body
    ) {
      throw HttpError(404, 'not found')
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Basic')) {
      throw HttpError(404, 'not found')
    }

    const token = authToken.split(' ')[1]
    const [user = '', pass] = Buffer.from(token, 'base64')
      .toString('ascii')
      .split(':')

    if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
      throw HttpError(401, 'unauthorized')
    }

    event.body = JSON.parse(event.body)

    if (!event.body.first_name || !event.body.last_name) {
      throw HttpError(400, 'invalid society_ids or first_name or last_name')
    }

    await updateUserName(
      event.pathParameters.user_id,
      event.body.first_name,
      event.body.last_name
    )

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'successfully updated',
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
