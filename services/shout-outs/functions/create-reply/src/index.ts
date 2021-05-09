import { HttpError } from './error'
import logger from './logger'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { setCorrelationId, errorHandler } from './middlewares'
import { validate } from 'jsonschema'
import { verifyToken } from './verifyAuthToken'
import schema from './createSchema.json'
import { createReplyToPost } from './db'

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)
    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { blacklisted, user_id, scope: serializedScope } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    const scope = JSON.parse(serializedScope)

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (blacklisted) {
      throw HttpError(403, 'User blacklisted. Cannot create a post')
    }

    const { valid, errors } = validate(event.body, schema)

    if (!valid) {
      throw HttpError(400, 'body missing required parameters', {
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      })
    }

    if (!scope[event.body.society_id] && scope.root !== true) {
      throw HttpError(404, 'not found')
    }

    if (!event.body.society_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(400, 'invalid society_id')
    } else if (!event.body.user_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(400, 'invalid user_id')
    } else if (!event.body.post_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(400, 'invalid post_id')
    } else if (event.body.created_at < Date.now() - 3600 * 1000) {
      throw HttpError(400, 'invalid created_at value')
    } else if (!event.body.user_name.match(/^[\w-]{5,60}$/)) {
      throw HttpError(400, 'invalid user_name')
    }

    const replyData = await createReplyToPost(event.body)

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: '',
        data: replyData,
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
  .use(jsonBodyParser())
