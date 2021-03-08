import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import { validate } from 'jsonschema'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

const myHandler: APIGatewayProxyHandler = (event: APIGatewayProxyEvent) => {}

export const handler = middy(myHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
