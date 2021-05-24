import AWS from 'aws-sdk'

const rekognition = new AWS.Rekognition()

// detect text
export const moderateImageContent = async (key: string) => {
  const params = {
    Image: {
      S3Object: {
        Bucket: process.env.UPLOAD_BUCKET_NAME || '',
        Key: key,
      },
    },
    MinConfidence: 60,
  }

  rekognition.detectModerationLabels(params, function (err, data) {
    if (err) console.log(err, err.stack)
    // an error occurred
    else console.log(data) // successful response
  })

  //   rekognition.detectText()
}
