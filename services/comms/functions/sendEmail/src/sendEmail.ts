import AWS_SES from 'aws-sdk/clients/ses'

const SES = new AWS_SES({
  apiVersion: '2010-12-01',
  ...(process.env.NODE_ENV !== 'production'
    ? {
        accessKeyId: 'akid',
        secretAccessKey: 'secret',
      }
    : {}),
})

export function sendEmail({
  from = 'no-reply@kinarva.com',
  to = [],
  subject = '',
  bodyHtml = '',
  bodyText = '',
}: {
  to: string[]
  from: string
  subject: string
  bodyHtml: string
  bodyText: string
}) {
  const charset = 'UTF-8'
  const params = {
    Source: from,
    Destination: {
      ToAddresses: to,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: charset,
      },
      Body: {
        Text: {
          Data: bodyText,
          Charset: charset,
        },
        Html: {
          Data: bodyHtml,
          Charset: charset,
        },
      },
    },
    // ConfigurationSetName: configuration_set
  }

  return SES.sendEmail(params)
    .promise()
    .then((data) => {
      console.log('email sent: ' + data.MessageId)
    })
    .catch((err) => {
      if (err) {
        console.error(err)
      }
    })
}
