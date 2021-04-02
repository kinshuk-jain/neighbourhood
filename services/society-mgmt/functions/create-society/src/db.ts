import logger from './logger'
import { v4 as uuidv4 } from 'uuid'

export const addSocietyRecord = async ({
  name,
  admins,
  user_id,
  address,
  society_type,
  show_directory,
  latitude,
  longitude,
}: {
  [key: string]: any
}) => {
  // use google geocoding api to get latitude and longitude for the address
  // if address is not found, we reject the request
  const tableName = 'society'
  logger.info({
    society_id: uuidv4(),
    name,
    billing_id: 123,
    admins,
    user_id,
    latitude,
    longitude,
    address,
    imp_contacts: [], // array of contact ids
    directory: [],
    society_type,
    show_directory,
    pending_deletion: false, // sets the society for deletion, only sysadmin can delete
    verified: false, // verify whether this society is valid and the person creating it is really its admin or not
  })
  // put this in DB if not exists
  // if a deleted society exists by this name, then allow
}
