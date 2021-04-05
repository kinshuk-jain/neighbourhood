import middy from '@middy/core'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import { validate } from 'jsonschema'
import schema from './listSocietySchema.json'
import {
  listSocietyByLocation,
  listSocietyByType,
  listSocietyNotApproved,
  listSocietyInRegion,
  listSocietyPendingDeletion,
  listSocietiesByName,
} from './db'
import { verifyToken } from './verifyAuthToken'

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

const myHandler: APIGatewayProxyHandler = async (
  event: any,
  context
): Promise<APIGatewayProxyResult> => {
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
    const { blacklisted, user_id, scope } =
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

    const { valid, errors } = validate(event.queryStringParameters, schema)

    if (!valid) {
      throw HttpError(400, 'body missing required parameters', {
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      })
    }

    const {
      filter,
      value = '',
      page_size = 20,
      page_number = 1,
    } = event.queryStringParameters

    if (!/^[\w-]+$/i.test(filter) || (value && !/^[\w-=.;]+$/i.test(value))) {
      throw HttpError(400, 'invalid filter value in query param')
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

    let responseBody

    const checkSysAdminPrivilege = (scope: string) => {
      if (scope !== 'sysadmin') {
        throw HttpError(403, 'not allowed')
      }
    }

    switch (filter) {
      case 'pending_approval':
        // sysadmin
        checkSysAdminPrivilege(scope)
        responseBody = await listSocietyNotApproved(pageNumber, pageSize)
        break
      case 'pending_deletion':
        // sysadmin
        checkSysAdminPrivilege(scope)
        responseBody = await listSocietyPendingDeletion(pageNumber, pageSize)
        break
      case 'type':
        // sysadmin
        checkSysAdminPrivilege(scope)
        responseBody = await listSocietyByType(value, pageNumber, pageSize)
        break
      case 'name':
        // user privilege
        responseBody = await listSocietiesByName(value, pageNumber, pageSize)
        break
      case 'postal_code':
        // user privilege
        responseBody = await listSocietyInRegion(value, pageNumber, pageSize)
        break
      case 'location':
        // user privilege
        // val = "lat=123123;lon=123123"
        responseBody = await listSocietyByLocation(value, pageNumber, pageSize)
      default:
        throw HttpError(400, 'invalid filter')
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        data: responseBody,
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
