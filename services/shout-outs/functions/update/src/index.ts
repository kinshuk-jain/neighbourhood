import { HttpError } from './error'
import logger from './logger'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { setCorrelationId, errorHandler } from './middlewares'
import { validate } from 'jsonschema'
import { verifyToken } from './verifyAuthToken'
import schema from './updateSchema.json'

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    if (
      !event.pathParameters ||
      !event.pathParameters.post_id ||
      !event.pathParameters.update_key
    ) {
      throw HttpError(404, 'not found')
    }

    if (
      !event.pathParameters.post_id.match(/^[\w-]{5,40}$/) ||
      !event.pathParameters.update_key.match(/^\/?[\w-]+\/?([\?#].*)?$/)
    ) {
      throw HttpError(404, 'not found')
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { blacklisted, user_id } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (blacklisted) {
      throw HttpError(403, 'User blacklisted. Cannot update post')
    }

    let route_path = (event.pathParameters.update_key.match(
      /^\/?([\w-]+)\/?/
    ) || [])[1]

    switch (route_path) {
      case 'content':
        // verify content with content moderation
        break
      case 'edited':
        break
      case 'comments':
        break
      case 'images':
        // no need to verify the images with content moderation
        // as we do that on image upload. If someone tries to call this api directly
        // without going through our upload and pushes any random images in here, we will not
        // show them on the UI as it shows only images from our domain
        break
      case 'user-name':
        break
      case 'report':
        // reported_by: update report - just update it and if number of reports becomes more than 10, we flag the user for super admin to check
        break
      default:
        throw HttpError(400, 'invalid update operation')
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

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: '',
        data: {},
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
