import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import { validate } from 'jsonschema'
import logger from 'logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const myHandler = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
  logger.info(event)
  return {
    isBase64Encoded: false,
    statusCode: 200,
    body: JSON.stringify({ status: 'ok' }),
  }
}

export const handler = middy(myHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
