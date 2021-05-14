import logger from './logger'
import { verifyToken } from './verifyAuthToken'
import { getUploadURL } from './getS3UploadUrl'

const HttpError = (status: number, message: string, body?: object): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}

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

    // do not check for blacklisting when downloading photo
    // check only on upload
    if (blacklisted) {
      throw HttpError(403, 'User blacklisted. Cannot upload photo')
    }

    // start upload or download

    // download - use pre-signed urls
    // var params = {Bucket: 'bucket', Key: 'key', Expires: 60};
    // var promise = s3.getSignedUrlPromise('getObject', params);
    // promise.then(function(url) {
    // console.log('The URL is', url);
    // }, function(err) { ... });

    // upload
    // await getUploadURL()
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
