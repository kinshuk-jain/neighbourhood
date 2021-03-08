import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { sendLoginCredsEmail } from './loginEmail'
import { validate } from 'jsonschema'
import schema from './emailRequestSchema.json'

const templateNameToFuncMapping: { [key: string]: Function } = {
  'login-email': sendLoginCredsEmail,
}

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Body missing in request' }),
      isBase64Encoded: false,
    }
  }
  const body = JSON.parse(event.body)
  const { template, params, recipients, subject } = body

  const { valid, errors } = validate(body, schema)

  if (!valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'body missing required parameters',
        missing_params: errors.map((error) => ({
          property: error.property,
          message: error.message,
          name: error.name,
        })),
      }),
      isBase64Encoded: false,
    }
  }

  if (!templateNameToFuncMapping[template]) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid template name' }),
    }
  }
  try {
    await templateNameToFuncMapping[template](params.link, recipients)
    return {
      statusCode: 200,
      body: JSON.stringify({}),
      isBase64Encoded: false,
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: e.message }),
    }
  }
}
