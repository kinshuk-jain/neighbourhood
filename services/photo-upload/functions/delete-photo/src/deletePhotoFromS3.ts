import AWS from 'aws-sdk'

AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

export const deletePhoto = async (
  user_id: string,
  photo_id: string
): Promise<Record<string, any>> => {
  const key = `uploads/${user_id}/${photo_id}`

  const params = {
    Bucket: process.env.UPLOAD_BUCKET_NAME || '',
    Key: key,
  }

  return new Promise((res, rej) => {
    s3.deleteObject(params, (err: Error, data: any) => {
      if (err) rej(err)
      res(data)
    })
  })
}
