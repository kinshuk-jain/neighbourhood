import { v4 as uuidv4 } from 'uuid'

/**
 * Create a reply table
 * reply table has reply_id, content, post_id, user_id, user_name, created_at, reported_by
 * post_id is partition key and reply_id is sort key
 */

export const createReplyToPost = async ({
  user_id,
  post_id,
  created_at,
  content,
  user_name,
}: {
  user_id: string
  post_id: string
  created_at: string
  content: string
  user_name: string
}): Promise<Record<string, any>> => {
  return {
    reply_id: uuidv4(),
    user_id,
    post_id,
    user_name,
    created_at,
    edited: false,
    // need to send this data to content moderation api before saving
    content: encodeURIComponent(content), // decode the content before returning back to frontend
    reported_by: [], // list of user_id's
  }
}
