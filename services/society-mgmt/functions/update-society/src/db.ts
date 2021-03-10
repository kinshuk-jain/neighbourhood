import logger from './logger'

export const updateSocietyBlacklistStatus = (
  society_id: string,
  status: boolean
) => {
  logger.info({
    society_id,
    status,
  })
}
export const updateSocietyName = (society_id: string, name: string) => {
  logger.info({
    society_id,
    name,
  })
}
export const updateSocietyAddress = (society_id: string, address: object) => {
  logger.info({ society_id, address })
}
export const updateSocietyTutorialKey = (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, status })
}
export const updateSocietyVerifiedStatus = (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, status })
}
export const updateSocietyShowDirectoryFlag = (
  society_id: string,
  status: boolean
) => {
  logger.info({ society_id, status })
}
export const addSocietyAdmin = (society_id: string, user_id: string) => {
  logger.info({ society_id, user_id })
}
export const removeSocietyAdmin = (society_id: string, user_id: string) => {
  logger.info({ society_id, user_id })
}
export const addSocietyImpContact = (society_id: string, user_id: string) => {
  logger.info({ society_id, user_id })
}
export const removeSocietyImpContact = (
  society_id: string,
  user_id: string
) => {
  logger.info({ society_id, user_id })
}
