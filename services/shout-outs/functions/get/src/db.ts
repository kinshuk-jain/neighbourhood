export const getPostData = async (
  society_id: string,
  post_id: string
): Promise<Record<string, any>> => {
  // get replies for the post_id
  return {
    post_id,
    society_id,
    user_name: 'ballu baba',
    type: 'post',
    created_at: Date.now(),
    image_urls: [],
    content: decodeURIComponent('content'), // decode the content before returning back to frontend
    reported_by: [], // list of user_id's
    num_comments: 0,
    replies: [
      {
        reply_id: '123-123-123-123',
        post_id,
        user_name: 'babu bhaiya',
        created_at: Date.now(),
        content: decodeURIComponent('content'),
        reported_by: [], // list of user_id's
      },
    ],
  }
}
