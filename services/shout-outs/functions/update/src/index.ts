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
} from './db'
import { decryptedEnv } from './getDecryptedEnvs'

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.USER_DATA_API_KEY) {
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

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { user_id, blacklisted } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }
    if (blacklisted) {
      throw HttpError(403, 'user blacklisted, not allowed')
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
