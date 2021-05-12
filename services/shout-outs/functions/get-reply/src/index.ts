import { HttpError } from './error'
import logger from './logger'
import middy from '@middy/core'
import { setCorrelationId, errorHandler } from './middlewares'
import { verifyToken } from './verifyAuthToken'
import { getRepliesForPost } from './db'

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    if (!event.pathParameters || !event.pathParameters.post_id) {
      throw HttpError(404, 'not found')
    }

    const {
      society_id,
      page_size = 20,
      page_number = 1,
    } = event.queryStringParameters

    if (
      !event.pathParameters.post_id.match(/^[\w-]{5,40}$/) ||
      !society_id.match(/^[\w-]{5,40}$/)
    ) {
      throw HttpError(404, 'not found')
    }

    const authToken = event.headers['Authorization']

    if (!authToken || !authToken.startsWith('Bearer')) {
      throw HttpError(401, 'unauthorized')
    }

    // get user id from authToken
    const { user_id, scope: serializedScope } =
      (await verifyToken(authToken.split(' ')[1])) || {}

    const scope = JSON.parse(serializedScope)

    if (!user_id) {
      throw HttpError(
        500,
        'internal service error: error decoding access token'
      )
    }

    if (!scope[society_id] && scope.root !== true) {
      throw HttpError(404, 'not found')
    }

    let pageSize, pageNumber
    try {
      pageSize = parseInt(page_size)
      pageNumber = parseInt(page_number)
    } catch (e) {
      throw new Error('page_size or page_number not an integer')
    }

    if (pageSize < 20) {
      throw new Error('page size less than 20 now allowed')
    } else if (pageSize > 200) {
      throw new Error('page size more than 200 not allowed')
    } else if (pageNumber < 1) {
      throw new Error('page number less than 1 not allowed')
    }

    const replies = await getRepliesForPost(
      event.pathParameters.post_id,
      pageNumber,
      pageSize
    )

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        data: replies,
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
