export const updateUserData = async (
  user_id: string,
  key: string,
  value: any
): Promise<boolean> => {
  console.log(`updating ${key} for user ${user_id} to value ${value}`)
  return true
}

export const updateUserSocietyApprovalStatus = async (
  society_id: string,
  user_id: string
): Promise<boolean> => {
  console.log('remove user_id from pending_approval table', society_id)
  console.log('add society_id to user_id society list', user_id)
  // update scope for user_id that this user has user_access for this society
  return true
}

export const updatePostLoginUserData = async ({
  user_id,
  user_agent,
  ip_address,
  email_verified,
  first_login,
}: {
  user_id: string
  user_agent: string
  ip_address: string
  email_verified: boolean
  first_login: boolean
}): Promise<boolean> => {
  console.log('update the following data in user table', {
    user_id,
    user_agent,
    ip_address,
    email_verified,
    first_login,
  })
  return true
}

export const updateAddress = async ({
  street_address,
  city,
  state,
  country,
  postal_code,
}: {
  street_address: string
  city: string
  state: string
  country: string
  postal_code: string
}): Promise<boolean> => {
  console.log(
    'remove user from all residential societies, and then update address',
    {
      street_address,
      city,
      state,
      country,
      postal_code,
    }
  )
  return true
}
