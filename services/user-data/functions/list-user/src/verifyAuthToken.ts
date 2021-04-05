import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { config, ENV } from './config'

const client = jwksClient({
  jwksUri: `${config[ENV].auth_domain}/.well-known/jwks.json`,
})

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key: any) => {
    if (err) throw err
    const signingKey = key.publicKey || key.rsaPublicKey
    callback(null, signingKey)
  })
}

export const verifyToken = (
  token: string
): Promise<{ [key: string]: any } | undefined | null> => {
  return new Promise((res, rej) => {
    if (process.env.ENVIRONMENT === 'development') {
      res(jwt.decode(token) as { [key: string]: any })
    } else {
      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS512'],
          issuer: config[ENV].my_domain,
        },
        function (err, decoded) {
          if (err) {
            rej(err)
          }
          res(decoded)
        }
      )
    }
  })
}
