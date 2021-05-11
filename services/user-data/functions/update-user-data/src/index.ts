import logger from './logger'
import middy from '@middy/core'
import { v4 as uuidv4 } from 'uuid'
import jsonBodyParser from '@middy/http-json-body-parser'
import { validate } from 'jsonschema'
import updateUserPostLoginSchema from './updateSchema.json'
import { decryptedEnv } from './getDecryptedEnvs'
import { verifyToken } from './verifyAuthToken'
import { getSocietyData, sendEmail } from './helpers'

import {
  updateUserData,
  updateUserSocietyApprovalStatus,
  updatePostLoginUserData,
  updateAddress,
  updateUserScope,
  updateUserBlacklistStatus,
  removeUserFromSociety,
  addSocietyToUserSocietyList,
  addUserToPendingListOfSociety,
  getUserData,
} from './db'

// map of usernames to their password keys - allowed to access this service
const USER_NAMES: { [key: string]: string } = {
  authentication: 'AUTHENTICATION_SERVICE_TOKEN',
  society_mgmt: 'SOCIETY_MGMT_SERVICE_TOKEN',
}

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

const myHandler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  const requestStartTime = Date.now()
  let response
  try {
    logger.info(event)

    // wait for resolution for 1s
    if (!process.env.AUTHENTICATION_API_KEY) {
      await Promise.race([
        decryptedEnv,
        new Promise((_, reject) => {
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

    let isServiceRequest = false
    let accessScope: Record<string, any> = {},
      userId = ''

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
      accessScope = JSON.parse(scope)
      userId = user_id
    } else {
      throw HttpError(401, 'unauthorized')
    }

    if (
      !event.pathParameters ||
      !event.pathParameters.user_id ||
      !event.pathParameters.user_id.match(/^[\w-]{5,40}$/) ||
      !event.pathParameters.proxy ||
      !event.pathParameters.proxy.match(/^\/?[\w-]+(\/[\w-]+)?\/?([\?#].*)?$/)
    ) {
      throw HttpError(404, 'not found')
    }

    let route_path = event.pathParameters.proxy.match(
      /^\/?([\w-]+(\/[\w-]+)?)\/?/
    )

    const checkPrivilege = (
      scope: Record<string, any>,
      privilege: string[]
    ) => {
      if (
        !isServiceRequest &&
        privilege.length === 1 &&
        privilege[0] === 'sysadmin' &&
        scope.root !== true
      ) {
        throw HttpError(403, 'not allowed')
      } else if (!isServiceRequest && event.pathParameters.user_id !== userId) {
        throw HttpError(403, 'not allowed')
      }
    }

    const verifyStatus = (status: boolean) => {
      if (typeof status !== 'boolean') {
        throw HttpError(400, 'invalid value for status parameter')
      }
    }

    const verifySocietyId = (id: string) => {
      if (!id.match(/^[\w-]{5,40}$/)) {
        throw HttpError(400, 'invalid society id')
      }
    }

    const route_path_tokens = (route_path || [])[1].split('/')

    switch (route_path_tokens[0]) {
      case 'post-login':
        // only sysadmin
        checkPrivilege(accessScope, ['sysadmin'])
        const { valid, errors } = validate(
          event.body,
          updateUserPostLoginSchema
        )
        if (!valid) {
          throw HttpError(400, 'body missing required parameters', {
            missing_params: errors.map((error) => ({
              property: error.property,
              message: error.message,
              name: error.name,
            })),
          })
        }
        if (!(await updatePostLoginUserData(event.body))) {
          throw HttpError(500, 'error updating user')
        }
        break
      case 'phone':
        checkPrivilege(accessScope, ['sysadmin', 'user'])
        const { phone } = event.body
        if (!/^\+?[0-9]{6,18}$/.test(phone)) {
          throw HttpError(400, 'invalid phone')
        }
        await updateUserData(userId, 'phone', phone)
        break
      case 'thumbnail':
        // just update it
        // TODO: do after photo uploads is possible
        break
      case 'show-phone':
        verifyStatus(event.body.status)
        await updateUserData(userId, 'show_phone', event.body.status)
        break
      case 'email-verification':
        checkPrivilege(accessScope, ['sysadmin'])
        verifyStatus(event.body.status)
        await updateUserData(userId, 'email_verified', event.body.status)
        break
      case 'society-list':
        verifySocietyId(event.body.society_id)
        if (!event.body.user_id.match(/^[\w-]{5,40}$/)) {
          throw HttpError(400, 'invalid user id')
        }
        const privilegedAccess = isServiceRequest || accessScope.root === true
        if (route_path_tokens[1] === 'add') {
          // get society data
          const { society_type } = !privilegedAccess
            ? await getSocietyData(event.body.society_id)
            : event.body
          if (society_type === 'residential') {
            await addSocietyToUserSocietyList(
              event.body.society_id,
              privilegedAccess ? event.body.user_id : userId,
              privilegedAccess ? event.body.privilege : 'user'
            )
          } else if (society_type === 'general') {
            // add to list of pending approval
            await addUserToPendingListOfSociety(
              event.body.society_id,
              privilegedAccess ? event.body.user_id : userId
            )
            // send notification to admins
          } else {
            throw HttpError(400, 'invalid society_type')
          }
        } else if (route_path_tokens[1] === 'remove') {
          await removeUserFromSociety(
            event.body.society_id,
            isServiceRequest || accessScope[event.body.society_id] === 'admin'
              ? event.body.user_id
              : userId
          )
        } else {
          throw HttpError(404, 'Not found')
        }
        break
      case 'address':
        if (!/^[a-zA-Z0-9-,\s\/]{2,60}$/i.test(event.body.street_address)) {
          throw HttpError(400, 'invalid street address')
        } else if (!/^[\w-\s]{2,40}$/i.test(event.body.state)) {
          throw HttpError(400, 'invalid state')
        } else if (!/^[\w-\s]{2,40}$/i.test(event.body.city)) {
          throw HttpError(400, 'invalid city')
        } else if (!/^[\w-\s]{2,40}$/i.test(event.body.country)) {
          throw HttpError(400, 'invalid country')
        } else if (!/^[0-9]{4,8}$/.test(event.body.address.postal_code)) {
          throw HttpError(400, 'invalid postal code')
        }
        await updateAddress(event.body)
        break
      case 'approval-status':
        // only admin privilege
        verifySocietyId(event.body.society_id)
        if (accessScope[event.body.society_id] === 'admin') {
          await updateUserSocietyApprovalStatus(
            event.body.society_id,
            event.body.user_id
          )
        } else {
          throw HttpError(403, 'Forbidden')
        }
        break
      case 'scope':
        verifySocietyId(event.body.society_id)
        if (
          !event.body.user_id.match(/^[\w-]{5,40}$/) ||
          typeof event.body.increase_scope !== 'boolean'
        ) {
          throw HttpError(400, 'invalid value for user_id or increase_scope')
        }
        if (accessScope[event.body.society_id] === 'admin') {
          await updateUserScope(
            event.body.society_id,
            event.body.user_id,
            event.body.increase_scope
          )
          const userData = await getUserData(event.body.user_id)
          const societyData = await getSocietyData(event.body.society_id)
          await sendEmail(
            [userData.email],
            '',
            event.body.increase_scope ? 'make-admin' : 'remove-admin',
            {
              first_name: userData.first_name,
              society_name: societyData.name,
            },
            event.body.user_id
          )
          // send notification
        }
        break
      case 'blacklist':
        checkPrivilege(accessScope, ['sysadmin'])
        if (
          !event.body.user_id.match(/^[\w-]{5,40}$/) ||
          typeof event.body.is_blacklisted !== 'boolean'
        ) {
          throw HttpError(400, 'invalid value for user_id or is_blacklisted')
        }
        await updateUserBlacklistStatus(
          event.body.user_id,
          event.body.is_blacklisted
        )
        const userData = await getUserData(event.body.user_id)
        await sendEmail(
          [userData.email],
          '',
          event.body.is_blacklisted ? 'blacklist-user' : 'unblacklist-user',
          {
            first_name: userData.first_name,
          },
          event.body.user_id
        )
        break
      // send notification
      default:
        throw HttpError(404, 'not found')
    }
    // TODO: add update user email flow

    response = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'successfully updated',
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
