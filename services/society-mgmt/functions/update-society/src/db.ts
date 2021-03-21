import logger from './logger'

export const updateSocietyBlacklistStatus = async (
  society_id: string,
  status: boolean
) => {
  logger.info({
    society_id,
    status,
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
export const updateSocietyTutorialKey = async (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, status })
}
export const updateSocietyVerifiedStatus = async (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, status })
}
export const updateSocietyShowDirectoryFlag = async (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, status })
}
export const addSocietyAdmin = async (society_id: string, user_id: string) => {
  logger.info({ society_id, user_id })
}
export const removeSocietyAdmin = async (
  society_id: string,
  user_id: string
) => {
  logger.info({ society_id, user_id })
}
export const addSocietyImpContact = async (
  society_id: string,
  user_id: string
) => {
  logger.info({ society_id, user_id })
}
export const removeSocietyImpContact = async (
  society_id: string,
  user_id: string
) => {
  logger.info({ society_id, user_id })
}
