import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { ENV, config } from './config'

/**
 * Create a reply table
 * reply table has reply_id, content, post_id, user_id, first_name, last_name, created_at, reported_by
 * post_id is partition key and reply_id is sort key
 */

export const createReplyToPost = async ({
  user_id,
  post_id,
  created_at,
  content,
  society_id,
}: {
  user_id: string
  post_id: string
  created_at: string
  content: string
  society_id: string
}): Promise<Record<string, any>> => {
  // if post_id is of type notice, do not allow replies
  // do not forget to update num_comments in posts table
  const { status, data } =
    process.env.ENVIRONMENT !== 'development'
      ? await axios.post(
          `${config[ENV].user_domain}/user/details`,
          {
            id_type: 'user_id',
            id_value: user_id,
          },
          {
            timeout: 10000, // 10s timeout
            auth: {
              username: 'shout-outs',
              password: process.env.USER_DATA_API_KEY || '',
            },
          }
        )
      : {
          status: 200,
          data: { data: { first_name: 'test', last_name: 'user' } },
        }

  if (status < 200 || status >= 300) {
    throw new Error('Internal service error. Could not fetch user data')
  }

  return {
    reply_id: uuidv4(),
    user_id,
    society_id,
    post_id,
    first_name: data.data.first_name,
    last_name: data.data.last_name,
    created_at,
    edited: false,
    // need to send this data to content moderation api before saving
    content: encodeURIComponent(content), // decode the content before returning back to frontend
    reported_by: [], // list of user_id's
  }
}
