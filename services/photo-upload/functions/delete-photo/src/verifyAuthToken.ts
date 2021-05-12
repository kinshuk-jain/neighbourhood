import { config, ENV } from './config'
import { createRemoteJWKSet } from 'jose/jwks/remote'
import { jwtVerify, JWTPayload } from 'jose/jwt/verify'

let jwks = createRemoteJWKSet(
  new URL(`${config[ENV].auth_domain}/.well-known/jwks.json`)
)

export const verifyToken = async (
  token: string
): Promise<JWTPayload | { [key: string]: any }> => {
  if (process.env.ENVIRONMENT === 'development') {
    const { 1: payload } = token.split('.')
    if (!payload) {
      throw new Error('invalid token')
    }
    try {
      return JSON.parse(Buffer.from(payload, 'base64').toString())
    } catch (e) {
      throw e
    }
  } else {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS512'],
      issuer: config[ENV].my_domain,
    })
    return payload
  }
}
