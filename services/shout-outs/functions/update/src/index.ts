import { HttpError } from './error'
import logger from './logger'
import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { setCorrelationId, errorHandler } from './middlewares'
import { verifyToken } from './verifyAuthToken'
import {
  updatePostContent,
  updatePostEditedStatus,
  updatePostImageUrls,
  updatePostReported,
  updateUserName,
} from './db'

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

    if (
      !event.pathParameters ||
      !event.pathParameters.post_id ||
      !event.pathParameters.society_id ||
      !event.pathParameters.update_key
    ) {
      throw HttpError(404, 'not found')
    }

    if (
      !event.pathParameters.post_id.match(/^[\w-]{5,40}$/) ||
      !event.pathParameters.society_id.match(/^[\w-]{5,40}$/) ||
      !event.pathParameters.update_key.match(/^\/?[\w-]+\/?([\?#].*)?$/)
    ) {
      throw HttpError(404, 'not found')
    }

    const authToken = event.headers['Authorization']
    let isServiceRequest = false
    let user_id = ''

    if (authToken.startsWith('Basic')) {
      // verify basic auth and get scope from token
      const token = authToken.split(' ')[1]
      const [user = '', pass] = Buffer.from(token, 'base64')
        .toString('ascii')
        .split(':')

      if (!USER_NAMES[user] || process.env[USER_NAMES[user]] !== pass) {
        throw HttpError(401, 'unauthorized')
      }
      isServiceRequest = true
    } else if (authToken.startsWith('Bearer')) {
      // decode token
      const { blacklisted, user_id: userId } =
        (await verifyToken(authToken.split(' ')[1])) || {}

      if (!userId) {
        throw HttpError(
          500,
          'internal service error: error decoding access token'
        )
      }
      if (blacklisted) {
        throw HttpError(403, 'user blacklisted, not allowed')
      }

      user_id = userId
    } else {
      throw HttpError(401, 'unauthorized')
    }

    let route_path = (event.pathParameters.update_key.match(
      /^\/?([\w-]+)\/?/
    ) || [])[1]

    switch (route_path) {
      case 'content':
        // verify content with content moderation
        await updatePostContent(
          event.pathParameters.society_id,
          event.pathParameters.post_id,
          user_id,
          event.body.content
        )
        break
      case 'edited':
        if (typeof event.body.status !== 'boolean') {
          throw HttpError(400, 'invalid status')
        }
        await updatePostEditedStatus(
          event.pathParameters.society_id,
          event.pathParameters.post_id,
          user_id,
          event.body.status
        )
        break
      case 'images':
        // no need to verify the images with content moderation
        // as we do that on image upload. If someone tries to call this api directly
        // without going through our upload and pushes any random images in here, we will not
        // show them on the UI as it shows only images from our domain
        await updatePostImageUrls(
          event.pathParameters.society_id,
          event.pathParameters.post_id,
          user_id,
          event.body.img_urls
        )
        break
      case 'report':
        await updatePostReported(
          event.pathParameters.society_id,
          event.pathParameters.post_id,
          user_id
        )
        break
      case 'user-name':
        // only sysadmin privilege
        if (!isServiceRequest) {
          throw HttpError(404, 'Not found')
        }
        if (
          !event.body.user_id ||
          !event.body.first_name ||
          !event.body.last_name
        ) {
          throw HttpError(400, 'invalid society_ids or first_name or last_name')
        }
        await updateUserName(
          event.body.user_id,
          event.body.first_name,
          event.body.last_name
        )
        break
      default:
        throw HttpError(400, 'invalid update operation')
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'sucessfully updated',
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
