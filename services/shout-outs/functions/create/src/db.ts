import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { ENV, config } from './config'

/**
 * Have society_id as partition key and post_id as sort key
 * Have a secondary index with user_id as partition key and post_id as sort key and store society_id there
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
    post_id: uuidv4(),
    user_id,
    first_name: data.data.first_name,
    last_name: data.data.last_name,
    society_id,
    type,
    edited: false,
    created_at,
    // no need to verify the images with content moderation
    // as we do that on image upload. If someone tries to call this api directly
    // without going through our upload and pushes any random images in here, we will not
    // show them on the UI as it shows only images from our domain
    image_urls: (image_urls || []).map((url) => encodeURI(url)),
    // need to send this data to content moderation api before saving
    content: encodeURIComponent(content), // decode the content before returning back to frontend
    reported_by: [], // list of user_id's
    num_comments: 0,
  }
}
