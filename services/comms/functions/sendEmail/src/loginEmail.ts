import {
  LoginEmail,
  non_html_support_text,
} from '../../../templates/emails/login'
import { sendEmail } from './sendEmail'
import ReactDOMServer from 'react-dom/server'
import React from 'react'

export function sendLoginCredsEmail(
  recipient: string[] = [''],
  loginLink: string
) {
  if (!Array.isArray(recipient)) {
    throw 'recipient must be an array of recipients'
  }
  if (!loginLink) {
    throw 'input missing: login link'
  }
  const subject = 'Your login for neighbourhood.com'
  const sender = 'Neighbourhood Login <no-reply@neighbourhood.com>'

  sendEmail({
    from: sender,
    to: recipient,
    subject,
    bodyText: non_html_support_text,
    // FIXME: optimize this, We can store a stringified version already
    bodyHtml: ReactDOMServer.renderToString(
      React.createElement(LoginEmail, {})
    ),
  })
}
