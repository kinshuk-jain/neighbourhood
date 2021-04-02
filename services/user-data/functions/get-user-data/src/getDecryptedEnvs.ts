import { KMS } from 'aws-sdk'
import logger from './logger'

const encryptedEnvironmentVariableNames =
  process.env.ENVIRONMENT === 'development'
    ? []
    : ['AUTHENTICATION_SERVICE_TOKEN']

encryptedEnvironmentVariableNames.forEach((name) => {
  if (!process.env[name]) {
    logger.error(`missing env variable ${name}`)
    throw new Error('Internal service error')
  }
})

const kms = new KMS()

const decrypt = (data: string = '') =>
  new Promise((resolve, reject) =>
    kms.decrypt(
      {
        // specify a key id here
        CiphertextBlob: Buffer.from(data, 'base64'),
      },
      (err, result: KMS.DecryptResponse) => {
        if (err) {
          reject(err)
        } else {
          resolve(result.Plaintext ? result.Plaintext.toString() : '')
        }
      }
    )
  )

// We export a promise directly, so that it will stay resolved in
// future executions of the same lambda, reducing the number of decryption calls
export const decryptedEnv = Promise.all(
  encryptedEnvironmentVariableNames.map((name: string) =>
    decrypt(process.env[name]).then((data) => ({ [name]: data }))
  )
).then((array) =>
  array.reduce((config, item) => ({ ...config, ...item }), { ...process.env })
)
