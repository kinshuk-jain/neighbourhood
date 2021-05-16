import { v4 as uuidv4 } from 'uuid'
import AWS from 'aws-sdk'

AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300

export const getUploadURL = async (user_id: string) => {
  const key = `uploads/${user_id}/${uuidv4()}.jpg`

  let params: AWS.S3.PresignedPost.Params = {
    Bucket: process.env.UPLOAD_BUCKET_NAME,
    Fields: {
      key,
    },
    Expires: URL_EXPIRATION_SECONDS,
    Conditions: [
      ['content-length-range', 10, 10485760],
      ['acl', 'public-read'],
      ['starts-with', '$Content-Type', 'image/'],
    ],
  }

  const preSignedPostData: AWS.S3.PresignedPost = await new Promise(
    (resolve, reject) => {
      s3.createPresignedPost(
        params,
        (err: Error, data: AWS.S3.PresignedPost) => {
          if (err) {
            reject(err)
          }
          resolve(data)
        }
      )
    }
  )

  return {
    ...preSignedPostData,
    key,
  }
}
