import axios from 'axios'
import logger from './logger'
import { config, ENV } from './config'

export const getSocietyData = async (society_id: string): Promise<any> => {
  if (process.env.ENVIRONMENT !== 'development') {
    return axios.get(`${config[ENV]}/society/${society_id}/details`, {
      timeout: 10000, // 10s timeout
      auth: {
        username: 'user_data',
        password: process.env.SOCIETY_MGMT_API_KEY || '',
      },
    })
  }
  return Promise.resolve({
    name: 'society name',
    society_type: '',
    id: 'sdddd',
  })
}

export const updateUserScopeInAuth = async (
  user_id: string,
  prev_scope: any,
  new_scope: any,
  blacklist: boolean
) => {
  if (process.env.ENVIRONMENT !== 'development') {
    return axios.put(
      `${config[ENV].auth_domain}/authentication/authorization`,
      {
        user_id,
        prev_scope,
        new_scope,
        blacklist,
      },
      {
        timeout: 10000, // 10s timeout
        auth: {
          username: 'user_data',
          password: process.env.AUTHENTICATION_API_KEY || '',
        },
      }
    )
  }
  return Promise.resolve({ status: 200 })
}

export const sendEmail = async (
  recipients: string[],
  subject: string,
  template: string,
  params: Record<string, any>,
  user_id: string
): Promise<boolean> => {
  // send email to admin that society creating request is accepted
  if (process.env.ENVIRONMENT !== 'development') {
    const { status } = await axios.post(
      `${config[ENV].comms_domain}/comms/email/send`,
      {
        template,
        recipients,
        subject,
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
      logger.info(`Could not send email for user: ${user_id}`)
      return false
    }
  } else {
    logger.info('sent email')
  }
  return true
}
