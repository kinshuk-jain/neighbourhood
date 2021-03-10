import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import logger from './logger'

import updateStatusSchema from './updateStatusSchema.json'
import updateNameSchema from './updateNameSchema.json'
import updateMemberSchema from './updateMemberSchema.json'
import updateAddressSchema from './updateAddressSchema.json'

import {
  updateSocietyBlacklistStatus,
  updateSocietyAddress,
  updateSocietyName,
  updateSocietyShowDirectoryFlag,
  updateSocietyTutorialKey,
  updateSocietyVerifiedStatus,
  addSocietyAdmin,
  removeSocietyAdmin,
  addSocietyImpContact,
  removeSocietyImpContact,
} from './db'

import { v4 as uuidv4 } from 'uuid'

// should be first middleware
const setCorrelationId = () => ({
  before: (handler: any, next: middy.NextFunction) => {
    const correlationId = uuidv4()
    logger.setCorrelationId(correlationId)
    handler.event.correlationId = correlationId
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

const schemaValidation = (body: any, schema: any) => {
  const { valid, errors } = validate(body, schema)

  if (!valid) {
    throw HttpError(400, 'body missing required parameters', {
      missing_params: errors.map((error) => ({
        property: error.property,
        message: error.message,
        name: error.name,
      })),
    })
  }
}

const HttpError = (status: number, message: string, body?: object): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}

const myHandler: APIGatewayProxyHandler = async (
  event: any
): Promise<APIGatewayProxyResult> => {
  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }

    if (!event.body) {
      throw HttpError(401, 'missing body')
    }

    if (
      !event.pathParameters ||
      !event.pathParameters.proxy ||
      !event.pathParameters.proxy.match(
        /^\/?[\w-]+\/[\w-]+(\/[\w-]+)?\/?([\?#].*)?$/
      )
    ) {
      throw HttpError(404, 'not found')
    }

    let route_path = event.pathParameters.proxy.match(
      /^\/?([\w-]+\/[\w-]+(\/[\w-]+)?)\/?/
    )
    // this line should not throw as we have already verified url
    const route_path_tokens = (route_path || [])[1].split('/')

    let responseBody
    if (route_path_tokens[1] === 'tutorial') {
      // sys admin privilege
      schemaValidation(event.body, updateStatusSchema)
      const { status } = event.body
      responseBody = updateSocietyTutorialKey(route_path_tokens[0], status)
    } else if (route_path_tokens[1] === 'blacklist') {
      // sys admin privilege
      schemaValidation(event.body, updateStatusSchema)
      const { status } = event.body
      responseBody = updateSocietyBlacklistStatus(route_path_tokens[0], status)
    } else if (route_path_tokens[1] === 'verification') {
      // sys admin privilege
      schemaValidation(event.body, updateStatusSchema)
      const { status } = event.body
      responseBody = updateSocietyVerifiedStatus(route_path_tokens[0], status)
    } else if (route_path_tokens[1] === 'name') {
      // sys admin privilege
      schemaValidation(event.body, updateNameSchema)
      const { name } = event.body
      responseBody = updateSocietyName(route_path_tokens[0], name)
    } else if (route_path_tokens[1] === 'address') {
      // sys admin privilege
      schemaValidation(event.body, updateAddressSchema)
      const { postal_code, street_address, country, state, city } = event.body
      responseBody = updateSocietyAddress(route_path_tokens[0], {
        postal_code,
        street_address,
        country,
        state,
        city,
      })
    } else if (route_path_tokens[1] === 'show-directory') {
      // admin privilege
      schemaValidation(event.body, updateStatusSchema)
      const { status } = event.body
      responseBody = updateSocietyShowDirectoryFlag(
        route_path_tokens[0],
        status
      )
    } else if (route_path_tokens[1] === 'admin') {
      // admin privilege
      schemaValidation(event.body, updateMemberSchema)
      const { user_id } = event.body

      if (route_path_tokens[2] === 'add') {
        responseBody = addSocietyAdmin(route_path_tokens[0], user_id)
      } else if (route_path_tokens[2] === 'remove') {
        responseBody = removeSocietyAdmin(route_path_tokens[0], user_id)
      } else {
        throw HttpError(404, 'not found')
      }
    } else if (route_path_tokens[1] === 'contact') {
      // admin privilege
      schemaValidation(event.body, updateMemberSchema)
      const { user_id } = event.body

      if (route_path_tokens[2] === 'add') {
        responseBody = addSocietyImpContact(route_path_tokens[0], user_id)
      } else if (route_path_tokens[2] === 'remove') {
        responseBody = removeSocietyImpContact(route_path_tokens[0], user_id)
      } else {
        throw HttpError(404, 'not found')
      }
    } else {
      throw HttpError(404, 'not found')
    }

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ status: 'success', message: 'record updated' }),
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
