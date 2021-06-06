import AWS_DYNAMODB from 'aws-sdk/clients/dynamodb'
import { DataMapper } from '@aws/dynamodb-data-mapper'

const dynamodbClient = new AWS_DYNAMODB({
  sslEnabled: true,
  apiVersion: '2012-08-10',
  region: process.env.AWS_REGION,
  ...(process.env.NODE_ENV !== 'production'
    ? {
        accessKeyId: 'akid',
        secretAccessKey: 'secret',
        endpoint: 'http://localstack:4566',
      }
    : {}),
})

const dbMapper = new DataMapper({ client: dynamodbClient })

export default dbMapper
