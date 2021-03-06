import axios from 'axios'
import { config, ENV } from './config'

export const updateReplyContent = async (
  post_id: string,
  reply_id: string,
  user_id: string,
  content: string
): Promise<boolean> => {
  console.log(
    'content will be updated only if user_id created the reply',
    user_id
  )
  console.log('updating post content', reply_id, post_id, content)
  return true
}

export const updateReplyEditedStatus = async (
  post_id: string,
  reply_id: string,
  user_id: string,
  status: boolean
): Promise<boolean> => {
  console.log(
    'status will be updated only if user_id created the post',
    user_id
  )

  console.log('updating edited status', reply_id, post_id, status)
  return true
}

export const updatePostReported = async (
  post_id: string,
  reply_id: string,
  user_id: string
): Promise<boolean> => {
  // get post_id and see how many users have reported it
  // if less than 10, simply add this user_id, post_id, reply_id to the list reported_by if not already present
  // if more than 10, then call user-data api reporting user who created reply_id
  console.log(reply_id, post_id)
  if (process.env.ENVIRONMENT !== 'development') {
    await axios.post(
      `${config[ENV].user_domain}/user/${user_id}/blacklist`,
      {
        user_id, // this user_id needs to be of the user who created the post not the user_id reporting it
        is_blacklisted: true,
      },
      {
        timeout: 10000, // 10s timeout
        auth: {
          username: 'shout-outs',
          password: process.env.USER_DATA_API_KEY || '',
        },
      }
    )
  } else {
    console.log('user blacklisted')
  }
  return true
}
