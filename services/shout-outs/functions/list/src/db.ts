export const getPostsBySociety = async (
  society_id: string,
  pageNumber: number,
  pageSize: number
): Promise<Record<string, any>[]> => {
  console.log(
    'return an array of posts with their replies in this society',
    society_id
  )
  console.log(
    'retrieve results from: ',
    (pageNumber - 1) * pageSize,
    ' to ',
    pageNumber * pageSize - 1
  )

  return [
    {
      post_id: '123123',
      society_id,
      first_name: 'ballu',
      last_name: 'baba',
      type: 'post',
      created_at: Date.now(),
      img_keys: [],
      edited: false,
      content: decodeURIComponent('content'), // decode the content before returning back to frontend
      reported_by: [], // list of user_id's
      num_comments: 0,
      // get only first 5 replies for the post
      replies: [
        {
          reply_id: '123-123-123-123',
          post_id: '123123',
          edited: false,
          first_name: 'ballu',
          last_name: 'baba',
          created_at: Date.now(),
          content: decodeURIComponent('content'),
          reported_by: [], // list of user_id's
        },
      ],
    },
  ]
}

export const getPostsByUser = async (
  user_id: string,
  pageNumber: number,
  pageSize: number
): Promise<Record<string, any>[]> => {
  console.log(
    'return an array of posts with their replies in this society',
    user_id
  )
  console.log(
    'retrieve results from: ',
    (pageNumber - 1) * pageSize,
    ' to ',
    pageNumber * pageSize - 1
  )

  return [
    {
      post_id: '123123',
      society_id: '1342342',
      first_name: 'ballu',
      last_name: 'baba',
      type: 'post',
      created_at: Date.now(),
      edited: false,
      img_keys: [],
      content: decodeURIComponent('content'), // decode the content before returning back to frontend
      reported_by: [], // list of user_id's
      num_comments: 0,
      // get only first 5 replies for the post
      replies: [
        {
          reply_id: '123-123-123-123',
          post_id: '123123',
          edited: false,
          first_name: 'ballu',
          last_name: 'baba',
          created_at: Date.now(),
          content: decodeURIComponent('content'),
          reported_by: [], // list of user_id's
        },
      ],
    },
  ]
}

// returns posts for a society by type
export const getPostsByType = async (
  society_id: string,
  type: string,
  pageNumber: number,
  pageSize: number
): Promise<Record<string, any>[]> => {
  console.log(
    'return an array of posts with their replies in this society where post type is given',
    society_id,
    type
  )
  console.log(
    'retrieve results from: ',
    (pageNumber - 1) * pageSize,
    ' to ',
    pageNumber * pageSize - 1
  )

  return [
    {
      post_id: '123123',
      society_id: '1342342',
      first_name: 'ballu',
      last_name: 'baba',
      type: 'post',
      created_at: Date.now(),
      img_keys: [],
      edited: false,
      content: decodeURIComponent('content'), // decode the content before returning back to frontend
      reported_by: [], // list of user_id's
      num_comments: 0,
      // get only first 5 replies for the post
      replies: [
        {
          reply_id: '123-123-123-123',
          post_id: '123123',
          edited: false,
          first_name: 'ballu',
          last_name: 'baba',
          created_at: Date.now(),
          content: decodeURIComponent('content'),
          reported_by: [], // list of user_id's
        },
      ],
    },
  ]
}
