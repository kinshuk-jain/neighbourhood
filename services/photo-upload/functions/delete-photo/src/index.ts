import { HttpError } from './error'
import logger from './logger'
import middy from '@middy/core'
import { setCorrelationId, errorHandler } from './middlewares'
import { verifyToken } from './verifyAuthToken'
import { deletePhoto } from './deletePhotoFromS3'

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    if (
      !event.pathParameters ||
      !event.pathParameters.user_id ||
      !event.pathParameters.photo_id ||
      !/^[\w-]{5,40}$/.test(event.pathParameters.user_id) ||
      !/^[\w\.-]{5,40}$/.test(event.pathParameters.photo_id)
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
      throw HttpError(403, 'User blacklisted. Cannot delete photo')
    }

    if (user_id !== event.pathParameters.user_id) {
      // photo not uploaded by user himself
      throw HttpError(403, 'Forbidden')
    }

    // delete photo
    await deletePhoto(user_id, event.pathParameters.photo_id)

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'photo deleted',
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
