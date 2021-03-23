// do not show users with is_blacklisted = true
export const listUsersBySociety = async (
  society_id: string,
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.log('list all users in this society: ', society_id)
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}
// do not show users with is_blacklisted = true
export const listUsersNotApproved = async (
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

export const listUsersReported = async (
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  // return users who have been not been is_blacklisted but have reported_count at least 1
  console.log(
    'retrieve users who have been reported at least 1: ',
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
