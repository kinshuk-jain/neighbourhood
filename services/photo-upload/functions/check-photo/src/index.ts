import FilteType from 'file-type'
import Jimp from 'jimp'
import logger from './logger'
import {
  getObjectBytesFromS3,
  deleteObjectFromS3,
  putTagsToObjectInS3,
  getObjectFromS3,
  putBlurredImageInS3,
} from './s3'

import { moderateImage } from './rekognition'

export const handler = async (event: any) => {
  for (let record of event.Records) {
    await checkPhoto(record)
  }
}

const allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'bmp', 'gif']

async function checkPhoto(record: Record<string, any>) {
  const objectKey = record.s3.object.key
  const initialBytes = await getObjectBytesFromS3(objectKey)
  // check file type
  const { ext } = (await FilteType.fromBuffer(initialBytes)) as {
    ext: string
    mime: string
  }

  if (allowedExtensions.includes(ext)) {
    putTagsToObjectInS3(objectKey, [
      {
        Key: 'verification',
        Value: 'approved',
      },
    ])
  } else {
    // file type not allowed
    await deleteObjectFromS3(objectKey)
  }

  // moderate content with rekognition
  const blurImage = await moderateImage(objectKey)
  if (blurImage) {
    try {
      const image = await Jimp.read(await getObjectFromS3(objectKey))
      const imageBuf = await image.blur(40).getBufferAsync(image.getMIME())
      await putBlurredImageInS3(objectKey, imageBuf)
    } catch (e) {
      logger.info('error blurring image with key: ' + objectKey)
      logger.info(e)
    }
  }
}
