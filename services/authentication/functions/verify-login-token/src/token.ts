import { SignJWT } from 'jose/jwt/sign'
import logger from './logger'
import { randomBytes, createPrivateKey } from 'crypto'
import { config, ENV } from './config'

export async function createRefreshToken(): Promise<string> {
  // randomBytes uses libuv thread pool
  return randomBytes(32).toString('base64')
}

export function createAccessToken(
  user_id: string,
  scope: string,
  for_blacklisted_user: boolean
): Promise<any> {
  return new SignJWT({
    blacklisted: for_blacklisted_user ? true : false,
    scope,
    user_id,
  })
    .setProtectedHeader({ alg: 'RS512' })
    .setIssuedAt()
    .setIssuer(config[ENV].my_domain)
    .setAudience(user_id)
    .setExpirationTime('15m')
    .sign(
      createPrivateKey({
        key: process.env.PVT_KEY || '',
        passphrase: process.env.KEY_PASS || '',
      })
    )
    .catch((err) => {
      logger.info({
        type: 'error signing token',
        message: err.message,
        stack: err.stack,
      })
    })
}
