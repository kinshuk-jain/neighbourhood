import AWS from 'aws-sdk'
import logger from './logger'

const rekognition = new AWS.Rekognition()

const BANNED_LABELS = [
  'Explicit Nudity',
  'Violence',
  'Hate Symbols',
  'Visually Disturbing',
]

const IMAGE_BLOCK_SCORE = 75

// returns true or false depending on whether image should be deleted or not
// if true, delete image
export const moderateImage = async (key: string): Promise<boolean> => {
  const params = {
    Image: {
      S3Object: {
        Bucket: process.env.UPLOAD_BUCKET_NAME || '',
        Key: key,
      },
    },
    MinConfidence: 60,
  }

  return new Promise((res, rej) => {
    rekognition.detectModerationLabels(
      params,
      function (err, data: AWS.Rekognition.DetectModerationLabelsResponse) {
        if (err) {
          logger.info(err)
          rej(err)
        }

        data.ModerationLabels?.some(
          (label: AWS.Rekognition.ModerationLabel) => {
            const { Confidence = 0, Name = '', ParentName = '' } = label
            if (
              Confidence >= IMAGE_BLOCK_SCORE &&
              (BANNED_LABELS.includes(ParentName) ||
                BANNED_LABELS.includes(Name))
            ) {
              res(true)
            }
          }
        )
        res(false)
      }
    )
  })
}
