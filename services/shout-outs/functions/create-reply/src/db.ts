import { v4 as uuidv4 } from 'uuid'

/**
 * Create a reply table
 * reply table has reply_id, content, post_id
 * post_id is partition key and reply_id is sort key
 */

export const createReplyToPost = async ({
  user_id,
  post_id,
  created_at,
  content,
}: {
  user_id: string
  post_id: string
  created_at: string
  content: string
}): Promise<Record<string, any>> => {
  return {
    reply_id: uuidv4(),
    user_id,
    post_id,
    created_at,
    content: encodeURIComponent(content), // decode the content before returning back to frontend
    reported_by: [], // list of user_id's
  }
}
