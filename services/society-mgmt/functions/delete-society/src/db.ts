import logger from './logger'

export const deleteSociety = (society_id: string, user_id: string) => {
  // just mark society as deleted
  // delete feeds, messages, chats, clubs, events, contacts assoiated with this
  // keep all this data for analytics
  // what happens to users of this society??
  logger.info({ society_id, user_id })
}

export const updateSocietyPendingDeletionStatus = async (
  society_id: string,
  user_id: string
) => {
  console.log('marking society for deletion: set pending_deletion = true')
  logger.info({
    society_id,
    pending_deletion: true,
    delete_request_by: user_id,
  })
}
