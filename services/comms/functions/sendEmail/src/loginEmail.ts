import {
  LoginEmail,
  non_html_support_text,
} from '../../../templates/emails/login'
import { sendEmail } from './sendEmail'
import ReactDOMServer from 'react-dom/server'
import React from 'react'

export function sendLoginCredsEmail(
  recipient: string[] = [''],
  params: { [key: string]: string }
) {
  if (!Array.isArray(recipient)) {
    throw 'recipient must be an array of recipients'
  } else if (!params.link) {
    throw 'input missing: login link'
  } else if (!params.first_name) {
    throw 'input missing: first_name'
  } else if (!params.last_name) {
    throw 'input missing: last_name'
  }

  const subject = 'Your login for neighbourhood.com'
  const sender = 'Neighbourhood Login <no-reply@neighbourhood.com>'

  return sendEmail({
    from: sender,
    to: recipient,
    subject,
    bodyText: non_html_support_text,
    // FIXME: optimize this, We can store a stringified version already
    // can create a template in SES and sendTemplatedEmail
    bodyHtml: ReactDOMServer.renderToString(
      React.createElement(LoginEmail, {})
    ),
  })
}
