import jwt from 'jsonwebtoken'
import logger from './logger'
import { randomBytes } from 'crypto'
import { config, ENV } from './index'

export async function createRefreshToken(): Promise<string> {
  // randomBytes uses libuv thread pool
  return randomBytes(32).toString('base64')
}

export function createAccessToken(
  user_id: string,
  scope: string,
  for_blacklisted_user: boolean
): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        blacklisted: for_blacklisted_user ? true : false,
        scope,
        user_id,
      },
      {
        key: process.env.PVT_KEY || '',
        passphrase: process.env.KEY_PASS || '',
      },
      {
        expiresIn: 900,
        audience: user_id,
        issuer: config[ENV].my_domain,
        algorithm: 'RS512',
        keyid: 'qH7ew01sEvtw1v2uOOXzrz8tFIGxeUct',
      },
      (err, token) => {
        if (err) {
          reject(err)
        }
        resolve(token)
      }
    )
  })
    .then((token) => token)
    .catch((err) => {
      logger.info({
        type: 'error signing token',
        message: err.message,
        stack: err.stack,
      })
    })
}
