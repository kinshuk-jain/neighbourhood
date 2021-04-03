import { pem2jwk } from 'pem-jwk'
import logger from './logger'

const requiredEnvVars = ['PUB_KEY']

requiredEnvVars.forEach((name) => {
  if (!process.env[name]) {
    logger.error(`missing env variable ${name}`)
    throw new Error('Internal service error')
  }
})

const keyId = 'qH7ew01sEvtw1v2uOOXzrz8tFIGxeUct'

// the public key is injected from ssm at deploy time
export const handler = async () => {
  const jwks = [
    () => ({
      alg: 'RS512',
      use: 'sig',
      kid: keyId,
      ...pem2jwk(process.env.PUB_KEY || ''),
    }),
  ]

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ keys: jwks }),
  }
}
