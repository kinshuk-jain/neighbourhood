import logger from './logger'
import { verifyToken } from './verifyAuthToken'
import { getUploadURL } from './getS3PreSignedUrl'

const HttpError = (status: number, message: string, body?: object): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}

const allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'bmp', 'gif']

export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response

  try {
    logger.info(event)

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    const { blacklisted, user_id } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (blacklisted) {
      throw HttpError(403, 'User blacklisted. Cannot upload photo')
    }

    const { ext } = event.queryStringParameters

    if (!ext || !allowedExtensions.includes(ext)) {
      throw HttpError(
        400,
        'photo format not supported. Please consider uploading photo in png, jpg, jpeg, webp or gif format'
      )
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        data: JSON.stringify(await getUploadURL(user_id, ext)),
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
