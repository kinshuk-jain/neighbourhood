import { pem2jwk } from 'pem-jwk'

const requiredEnvVars = ['PUB_KEY']

requiredEnvVars.forEach((name) => {
  if (!process.env[name]) {
    console.error(`missing env variable ${name}`)
    throw new Error('Internal service error')
  }
})

const keyId = 'qH7ew01sEvtw1v2uOOXzrz8tFIGxeUct'
const jwks = [
  {
    alg: 'RS512',
    use: 'sig',
    kid: keyId,
    ...pem2jwk(process.env.PUB_KEY || ''),
  },
]

// the public key is injected from ssm at deploy time
export const handler = async (event: any) => {
  console.log(JSON.stringify(event))
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ keys: jwks }),
  }
}
