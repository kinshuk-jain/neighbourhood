import { promisify } from 'util'
import jwt from 'jsonwebtoken'
import logger from './logger'
import { randomBytes } from 'crypto'

export async function createRefreshToken(): Promise<string> {
  // randomBytes uses libuv thread pool
  return randomBytes(32).toString('base64')
}

export function createAccessToken(email: string): Promise<string> {
  // const sign = promisify(jwt.sign)
  // return sign(
  //   {},
  //   { key: privateKey, passphrase: process.env.KEY_PASSWORD },
  //   {
  //     expiresIn: process.env.,
  //     audience: email,
  //     issuer: process.env.MY_DOMAIN,
  //     algorithm: 'RS256',
  //   }
  // )
  //   .then((token) => token)
  //   .catch((err) => {
  //     logger.info({
  //       type: 'error signing token',
  //       message: err.message,
  //       stack: err.stack,
  //     })
  //   })
  console.log('creating access token: ', email)
  return Promise.resolve('123123')
}
