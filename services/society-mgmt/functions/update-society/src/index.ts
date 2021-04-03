import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import logger from './logger'
import { decryptedEnv } from './getDecryptedEnvs'
import { sendEmailToAllAdmins, sendNotificationToAllAdmins } from './send-email'

import updateStatusSchema from './updateStatusSchema.json'
import updateNameSchema from './updateNameSchema.json'
import updateMemberSchema from './updateMemberSchema.json'
import updateAddressSchema from './updateAddressSchema.json'

import {
  updateSocietyPendingDeletionStatus,
  updateSocietyAddress,
  updateSocietyName,
  updateSocietyShowDirectoryFlag,
  updateSocietyVerifiedStatus,
  addSocietyAdmin,
  removeSocietyAdmin,
  addSocietyImpContact,
  removeSocietyImpContact,
} from './db'

import { v4 as uuidv4 } from 'uuid'

export const config: { [key: string]: any } = {
  development: {
    comms_domain: 'http://localhost:3000',
  },
  staging: {
    comms_domain: 'http://localhost:3000',
  },
  production: {
    comms_domain: 'http://localhost:3000',
  },
}

export const ENV = process.env.ENVIRONMENT || 'development'

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
  event: any,
  context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.COMMS_API_KEY) {
      await Promise.race([
        decryptedEnv,
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject('internal error: env vars not loaded')
          }, 1000)
        }),
      ])
    }

    const authToken = event.headers['Authorization']

    if (!authToken) {
      throw HttpError(401, 'unauthorized')
    }
    // TODO: if user is blacklisted, he/she cannot update a society

    if ('not admin or sysadmin privilege') {
      throw HttpError(404, 'not found')
    }

    if (!event.body) {
      throw HttpError(401, 'missing body')
    }

    if (
      !event.pathParameters ||
      !event.pathParameters.society_id ||
      !event.pathParameters.proxy ||
      !event.pathParameters.proxy.match(/^\/?[\w-]+(\/[\w-]+)?\/?([\?#].*)?$/)
    ) {
      throw HttpError(404, 'not found')
    }

    let route_path = event.pathParameters.proxy.match(
      /^\/?([\w-]+(\/[\w-]+)?)\/?/
    )
    const society_id = event.pathParameters.society_id

    if (!society_id.match(/^[\w-]{5,40}$/)) {
      throw HttpError(404, 'not found')
    }

    // this line should not throw as we have already verified url
    const route_path_tokens = (route_path || [])[1].split('/')
    let isRouteNotFound = false

    if (route_path_tokens[0] === 'verification') {
      // sys admin privilege
      // if society is approved sent email + notification to admin
      await updateSocietyVerifiedStatus(society_id, true)
      // sendNotificationToAllAdmins()
      // sendEmailToAllAdmins()
    } else if (route_path_tokens[0] === 'name') {
      // sys admin privilege
      schemaValidation(event.body, updateNameSchema)
      const { name } = event.body
      if (!/^[a-zA-Z0-9-']{2,40}$/i.test(name)) {
        throw HttpError(400, 'invalid name')
      }
      await updateSocietyName(society_id, name)
      // sendNotificationToAllAdmins()
    } else if (route_path_tokens[0] === 'address') {
      // sys admin privilege
      schemaValidation(event.body, updateAddressSchema)
      const { postal_code, street_address, country, state, city } = event.body
      if (!/^[\w-]{2,40}$/i.test(country)) {
        throw HttpError(400, 'invalid country')
      } else if (!/^[0-9]{4,8}$/.test(postal_code)) {
        throw HttpError(400, 'invalid postal code')
      } else if (!/^[a-zA-Z0-9-,\/]{2,60}$/i.test(street_address)) {
        throw HttpError(400, 'invalid street address')
      } else if (!/^[\w-]{2,40}$/i.test(state)) {
        throw HttpError(400, 'invalid state')
      } else if (!/^[\w-]{2,40}$/i.test(city)) {
        throw HttpError(400, 'invalid city')
      }

      await updateSocietyAddress(society_id, {
        postal_code,
        street_address,
        country,
        state,
        city,
      })
      // sendNotificationToAllAdmins()
    } else if (route_path_tokens[0] === 'pending-deletion') {
      // admin privilege
      schemaValidation(event.body, updateStatusSchema)
      const { status } = event.body
      await updateSocietyPendingDeletionStatus(society_id, status)
      // sendNotificationToAllAdmins()
    } else if (route_path_tokens[0] === 'show-directory') {
      // admin privilege
      schemaValidation(event.body, updateStatusSchema)
      const { status } = event.body
      await updateSocietyShowDirectoryFlag(society_id, status)
      // sendNotificationToAllAdmins()
    } else if (route_path_tokens[0] === 'admin') {
      // admin privilege
      schemaValidation(event.body, updateMemberSchema)
      const { id } = event.body

      if (!id.match(/^[\w-]{5,40}$/)) {
        throw HttpError(404, 'not found')
      }

      if (route_path_tokens[1] === 'add') {
        await addSocietyAdmin(society_id, id)
      } else if (route_path_tokens[1] === 'remove') {
        await removeSocietyAdmin(society_id, id)
      } else {
        isRouteNotFound = true
      }
    } else if (route_path_tokens[0] === 'contact') {
      // admin privilege
      schemaValidation(event.body, updateMemberSchema)
      const { id } = event.body

      if (!id.match(/^[\w-]{5,40}$/)) {
        throw HttpError(404, 'not found')
      }

      if (route_path_tokens[1] === 'add') {
        await addSocietyImpContact(society_id, id)
      } else if (route_path_tokens[1] === 'remove') {
        await removeSocietyImpContact(society_id, id)
      } else {
        isRouteNotFound = true
      }
    } else {
      isRouteNotFound = true
    }

    if (isRouteNotFound) {
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
