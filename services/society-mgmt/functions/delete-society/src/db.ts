import logger from './logger'

export const deleteSociety = (society_id: string, user_id: string) => {
  // just mark society as deleted
  // delete feeds, messages, chats, clubs, events, contacts assoiated with this
  // keep all this data for analytics
  // what happens to users of this society??
  logger.info({ society_id, user_id })
}
