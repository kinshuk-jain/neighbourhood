import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import { validate } from 'jsonschema'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import logger from './logger'

const myHandler: APIGatewayProxyHandler = (event: APIGatewayProxyEvent) => {
  logger.info(event)
  // all members
  // all imp contacts
  // directory
  // address
  // blacklist status
  // bill
  // admins
  // name
  // userdata to check authorization

  console.log(JSON.stringify(event))
}

export const handler = middy(myHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
