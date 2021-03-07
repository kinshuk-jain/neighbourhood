require('dotenv').config({
  path: `./config/${process.env.NODE_ENV || 'development'}.env`,
})

import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { sendLoginCredsEmail } from './loginEmail'

const templates = {
  'user-login': sendLoginCredsEmail,
}

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  //   sendLoginCredsEmail()
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Body missing in request' }),
      isBase64Encoded: false,
    }
  }
  const body = JSON.parse(event.body)
  const { template, params, from, recipients, subject } = body
  // FIXME: validate the body
  return {
    statusCode: 200,
    body: JSON.stringify({}),
    isBase64Encoded: false,
  }
}
