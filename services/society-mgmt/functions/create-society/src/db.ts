import logger from './logger'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

export const addSocietyRecord = async ({
  name,
  admins,
  user_id,
  address,
  society_type,
  show_directory,
}: {
  [key: string]: any
}) => {
  // use google geocoding api to get latitude and longitude for the address
  // if address is not found, we reject the request
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
    lat = data.results[1].geometry.location.lat
    lng = data.results[1].geometry.location.lng
  }

  logger.info({
    society_id: uuidv4(),
    name,
    billing_id: 123,
    admins,
    user_id,
    latitude: lat,
    longitude: lng,
    address,
    imp_contacts: [], // array of contact ids
    directory: [],
    society_type,
    show_directory,
    delete_request_by: [], // list of users who have requested deletion of this society
    pending_deletion: false, // sets the society for deletion, only sysadmin can delete
    verified: false, // verify whether this society is valid and the person creating it is really its admin or not
  })
  // put this in DB if not exists
  // if a deleted society exists by this name, then allow
}
