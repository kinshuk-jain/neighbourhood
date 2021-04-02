import logger from './logger'

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
  address: object
) => {
  logger.info({ society_id, address })
}
export const updateSocietyVerifiedStatus = async (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, verified: status })
}
export const updateSocietyShowDirectoryFlag = async (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, show_directory: status })
}
export const addSocietyAdmin = async (society_id: string, user_id: string) => {
  logger.info({ society_id, user_id }) // add this user_id to list of admins
}
export const removeSocietyAdmin = async (
  society_id: string,
  user_id: string
) => {
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
