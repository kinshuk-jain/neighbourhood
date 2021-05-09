import { v4 as uuidv4 } from 'uuid'

/**
 * Have society_id as partition key and post_id as sort key
 * Have a secondary index with user_id as partition key and post_id as sort key
 */

export const createPost = async ({
  user_id,
  society_id,
  type,
  created_at,
  image_urls,
  content,
}: {
  user_id: string
  society_id: string
  type: string
  created_at: string
  image_urls?: string[]
  content: string
}): Promise<Record<string, any>> => {
  return {
    post_id: uuidv4(),
    user_id,
    society_id,
    type,
    created_at,
    image_urls: (image_urls || []).map((url) => encodeURI(url)),
    content: encodeURIComponent(content), // decode the content before returning back to frontend
    reported_by: [], // list of user_id's
    num_comments: 0,
  }
}
