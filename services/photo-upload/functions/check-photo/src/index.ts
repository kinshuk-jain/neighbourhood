import FilteType from 'file-type'
import {
  getObjectBytesFromS3,
  deleteObjectFromS3,
  putTagsToObjectInS3,
} from './s3'

export const handler = async (event: any) => {
  for (let record of event.Records) {
    await checkPhoto(record)
  }
}

const allowedExtensions: string[] = [
  'jpg',
  'jpeg',
  'png',
  'bmp',
  'ico',
  'gif',
  'webp',
]

async function checkPhoto(record: Record<string, any>) {
  const objectKey = record.s3.object.key
  const initialBytes = await getObjectBytesFromS3(objectKey)
  // check file type
  const { ext } = (await FilteType.fromBuffer(initialBytes)) as {
    ext: string
    mime: string
  }

  if (!allowedExtensions.includes(ext)) {
    // file type not allowed
    await deleteObjectFromS3(objectKey)
    putTagsToObjectInS3(objectKey, [
      {
        Key: 'verification',
        Value: 'approved',
      },
    ])
  }

  // moderate content with rekognition
}
