// do not show users with is_blacklisted = true
export const listUsersBySociety = async (
  user_id: string,
  society_id: string,
  limit_scope: boolean,
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  // check from society-mgmt whether show_directory is true or not
  if (limit_scope) {
    console.log(
      'list all users in this society provided society_id is in users own list of societies: ',
      society_id,
      user_id
    )
  } else {
    console.log('list all users in this society: ', society_id, user_id)
  }

  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

// do not show users with is_blacklisted = true
export const listUsersEmailNotVerified = async (
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

export const listUsersNotApproved = (
  user_id: string,
  society_id: string,
  limit_scope: boolean,
  page_number: number,
  page_size: number
) => {
  // return list of users who have not been approved to join the society
  if (limit_scope) {
    // check if user_id has this society_id in society_list
    // if yes, then return data or else not
  } else {
    console.log('society_id: ', society_id, user_id)
  }

  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

export const listUsersBlacklisted = async (
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

// do not show users with is_blacklisted = true
export const listUsersInRegion = async (
  postal_code: string,
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.log('getting users in postal_code: ', postal_code)
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}
