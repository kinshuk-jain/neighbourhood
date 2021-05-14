import { v4 as uuidv4 } from 'uuid'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300

export const getUploadURL = async function () {
  const Key = `${uuidv4()}.jpg`

  // Get signed URL from S3
  const s3Params = {
    Bucket: process.env.UploadBucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: 'image/jpeg',
  }

  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params)

  return JSON.stringify({
    uploadURL: uploadURL,
    Key,
  })
}
