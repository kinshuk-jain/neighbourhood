import { LoginEmail } from '../templates'
import { sendEmail } from './sendEmail'
import ReactDOMServer from 'react-dom/server'
import logger from './logger'
import React from 'react'

export function sendLoginCredsEmail(
  recipient: string[] = [''],
  params: { [key: string]: string }
) {
  if (!Array.isArray(recipient)) {
    throw new Error('recipient must be an array of recipients')
  } else if (!params.link) {
    throw new Error('input missing: login link')
  } else if (!params.first_name) {
    throw new Error('input missing: first_name')
  } else if (!params.last_name) {
    throw new Error('input missing: last_name')
  }

  const subject = 'Your login for neighbourhood.com'
  const sender = 'Neighbourhood Login <no-reply@neighbourhood.com>'

  if (process.env.ENVIRONMENT === 'development') {
    logger.info(
      ReactDOMServer.renderToString(React.createElement(LoginEmail, {}))
    )
    return Promise.resolve(true)
  }

  return sendEmail({
    from: sender,
    to: recipient,
    subject,
    bodyText: LoginEmail.getNonHtmlSupportText(),
    // FIXME: optimize this, We can store a stringified version already
    // can create a template in SES and sendTemplatedEmail
    bodyHtml: ReactDOMServer.renderToString(
      React.createElement(LoginEmail, {})
    ),
  })
}
