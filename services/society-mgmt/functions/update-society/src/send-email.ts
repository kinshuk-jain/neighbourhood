import axios from 'axios'
import { config, ENV } from './config'
import logger from './logger'

export const sendEmailToAllAdmins = async (
  template: string,
  params: { [key: string]: any }
) => {
  // call db to get emails of all admins for this society
  const { status } = await axios.post(
    `${config[ENV].comms_domain}/comms/email/send`,
    {
      template,
      recipients: ['aa@example.com'],
      subject: 'Society creation request accepted',
      params,
    },
    {
      timeout: 10000, // 10s timeout
      auth: {
        username: 'society_mgmt',
        password: process.env.COMMS_API_KEY || '',
      },
    }
  )

  if (status < 200 || status >= 300) {
    logger.info(`Could not send email to user`)
  }
}

export const sendNotificationToAllAdmins = async (
  user_id: string,
  template: string,
  params: { [key: string]: any }
) => {
  // update comms api usage for notification sending
  const { status } = await axios.post(
    `${config[ENV].comms_domain}/comms/notification/send`,
    {
      template,
      recipients: user_id,
      subject: 'Society creation request accepted',
      params,
    },
    {
      timeout: 10000, // 10s timeout
      auth: {
        username: 'society_mgmt',
        password: process.env.COMMS_API_KEY || '',
      },
    }
  )

  if (status < 200 || status >= 300) {
    logger.info(`Could not send notification for user: ${user_id}`)
  }
}
