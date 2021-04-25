import logger from './logger'
import axios from 'axios'
import { config, ENV } from './config'

export const updateSocietyPendingDeletionStatus = async (
  society_id: string,
  status: boolean
) => {
  logger.info({
    society_id,
    pending_deletion: status,
  })
}
export const updateSocietyName = async (society_id: string, name: string) => {
  logger.info({
    society_id,
    name,
  })
}
export const updateSocietyAddress = async (
  society_id: string,
  address: { [key: string]: string }
) => {
  let lat = '',
    lng = ''

  if (process.env.ENVIRONMENT !== 'development') {
    const addressComponet = encodeURIComponent(
      `${address.street_address}, ${address.city}, ${address.state}, ${address.postal_code}, ${address.country}`
    )
    const geocodeUri = `https://maps.googleapis.com/maps/api/geocode/json?language=en&key=${process.env.GOOGLE_GEOCODING_API_KEY}&address=${addressComponet}`

    const { status, data = {} } = await axios.get(geocodeUri)

    logger.info(data)

    if (
      status < 200 ||
      status >= 300 ||
      !data.status ||
      (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')
    ) {
      // api error
      throw {
        message: 'Internal service error: address could not be verified',
        statusCode: 500,
      }
    } else if (data.status === 'ZERO_RESULTS') {
      // invalid address
      throw {
        message: 'invalid address specified',
        statusCode: 400,
      }
    } else if (data.results.length > 1) {
      // ambiguous address
      throw {
        message:
          'address specified is ambiguous. try making it more specific or contact us',
        statusCode: 400,
      }
    }

    // see https://developers.google.com/maps/documentation/geocoding/overview#StatusCodes
    lat = data.results[0].geometry.location.lat
    lng = data.results[0].geometry.location.lng
  }

  logger.info({ society_id, address, latitude: lat, longitude: lng })
}
export const updateSocietyVerifiedStatus = async (
  society_id: string,
  user_id: string,
  verificationStatus: boolean
) => {
  console.log(
    'update society verified status and get society data from DB. Society_type will be passed below'
  )

  // add this user in admin list of current society
  logger.info({ society_id, user_id, verified: verificationStatus })

  // update scope, society_list in user-data for admin
  const { status } = await axios.post(
    `${config[ENV].user_domain}/user/${user_id}/society-list/add`,
    { society_id, user_id, privilege: 'admin', society_type: 'residential' },
    {
      timeout: 10000, // 10s timeout
      auth: {
        username: 'society_mgmt',
        password: process.env.USER_DATA_API_KEY || '',
      },
    }
  )

  if (status < 200 || status >= 300) {
    throw new Error('Could not update user society list')
  }
}
export const updateSocietyShowDirectoryFlag = async (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, show_directory: status })
}
export const addSocietyAdmin = async (
  society_id: string,
  user_id: string,
  email: string
) => {
  // user_id must not be a preexisting admin in current society
  // jsut add user to admin list
  logger.info({ society_id, user_id, email }) // add this user_id to list of admins as {user_id, email}
}
export const removeSocietyAdmin = async (
  society_id: string,
  user_id: string
) => {
  // user_id must be a preexisting admin in current society
  // jsut remove user from admin list
  logger.info({ society_id, user_id }) // remove this user_id from list of admins
}
export const addSocietyImpContact = async (
  society_id: string,
  contact_id: string
) => {
  logger.info({ society_id, contact_id }) // add this contact_id to list of imp_contacts
}
export const removeSocietyImpContact = async (
  society_id: string,
  contact_id: string
) => {
  logger.info({ society_id, contact_id }) // remove this contact_id from list of imp_contacts
}
