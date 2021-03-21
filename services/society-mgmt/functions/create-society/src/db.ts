import logger from './logger'

export const addSocietyRecord = async ({
  is_blacklisted,
  name,
  admins,
  user_id,
  address,
  imp_contacts,
  society_type,
  show_directory,
}: {
  [key: string]: any
}) => {
  const tableName = 'society'
  logger.info({
    is_blacklisted,
    name,
    billing_id: 123,
    admins,
    user_id,
    address,
    imp_contacts,
    directory: [],
    society_type,
    show_directory,
    pending_deletion: false, // sets the society for deletion, only sysadmin can delete
    verified: false, // verify whether this society is valid and the person creating it is really its admin or not
  })
  // put this in DB if not exists
  // if a deleted society exists by this name, then allow
}
