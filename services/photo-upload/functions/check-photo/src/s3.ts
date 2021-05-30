import AWS from 'aws-sdk'

AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

export const getObjectBytesFromS3 = async (
  key: string,
  num_bytes: number = 6
): Promise<Buffer> => {
  const params = {
    Bucket: process.env.UPLOAD_BUCKET_NAME || '',
    Key: key,
    Range: `bytes=0-${Math.floor(Math.abs(num_bytes))}`,
  }

  return new Promise((res, rej) => {
    s3.getObject(
      params,
      function (err: AWS.AWSError, data: AWS.S3.GetObjectOutput) {
        if (err) rej(err)
        /*
       data = {
        AcceptRanges: "bytes", 
        ContentLength: 10, 
        ContentRange: "bytes 0-9/43", 
        ContentType: "text/plain", 
        ETag: "\"0d94420ffd0bc68cd3d152506b97a9cc\"", 
        LastModified: <Date Representation>, 
        Metadata: {
        }, 
        VersionId: "null"
       }
       */
        res(data.Body as Buffer)
      }
    )
  })
}

export const getObjectFromS3 = async (key: string): Promise<Buffer> => {
  const params = {
    Bucket: process.env.UPLOAD_BUCKET_NAME || '',
    Key: key,
  }

  return new Promise((res, rej) => {
    s3.getObject(
      params,
      function (err: AWS.AWSError, data: AWS.S3.GetObjectOutput) {
        if (err) rej(err)
        res(data.Body as Buffer)
      }
    )
  })
}

export const deleteObjectFromS3 = async (key: string) => {
  const params = {
    Bucket: process.env.UPLOAD_BUCKET_NAME || '',
    Key: key,
  }

  return new Promise((res, rej) => {
    s3.deleteObject(
      params,
      function (err: AWS.AWSError, data: AWS.S3.DeleteObjectOutput) {
        if (err) rej(err)
        res(data)
      }
    )
  })
}

export const putBlurredImageInS3 = async (key: string, body: Buffer) => {
  const params = {
    ACL: 'public-read',
    Body: body,
    Bucket: process.env.UPLOAD_BUCKET_NAME || '',
    Key: key,
    Tagging: 'verification=blurred',
  }

  return new Promise((res, rej) => {
    s3.putObject(
      params,
      function (err: AWS.AWSError, data: AWS.S3.PutObjectTaggingOutput) {
        if (err) rej(err)
        res(data)
      }
    )
  })
}

export const putTagsToObjectInS3 = async (key: string, tags: AWS.S3.TagSet) => {
  const params = {
    Bucket: process.env.UPLOAD_BUCKET_NAME || '',
    Key: key,
    Tagging: {
      TagSet: tags,
    },
  }

  return new Promise((res, rej) => {
    s3.putObjectTagging(
      params,
      function (err: AWS.AWSError, data: AWS.S3.PutObjectTaggingOutput) {
        if (err) rej(err)
        res(data)
      }
    )
  })
}
