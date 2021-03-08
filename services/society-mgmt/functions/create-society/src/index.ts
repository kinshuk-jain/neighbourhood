import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import { validate } from 'jsonschema'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const myHandler = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    body: JSON.stringify({ status: 'ok' }),
  }
}

export const handler = middy(myHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
