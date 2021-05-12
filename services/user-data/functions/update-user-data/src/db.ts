import { updateUserScopeInAuth } from './helpers'

export const updateUserData = async (
  user_id: string,
  key: string,
  value: any
): Promise<boolean> => {
  console.log(`updating ${key} for user ${user_id} to value ${value}`)
  return true
}

export const updateUserName = async (
  user_id: string,
  first_name: string,
  last_name: any
): Promise<boolean> => {
  //
  console.log(`updating ${first_name} ${last_name} for user ${user_id}`)
  return true
}

export const getUserData = async (user_id: string) => {
  console.log('get user data', user_id)
  return {
    email: 'aa@example.com',
    first_name: 'yolo',
  }
}

export const updateUserSocietyApprovalStatus = async (
  society_id: string,
  user_id: string
): Promise<boolean> => {
  console.log('remove user_id from pending_approval table', society_id)
  console.log('add society_id to user_id society list', user_id)
  // update scope for user_id that this user has user access for this society
  return true
}

export const addUserToPendingListOfSociety = async (
  society_id: string,
  user_id: string
): Promise<boolean> => {
  console.log(
    'add user to pending list of society, pending approval by admin',
    society_id,
    user_id
  )
  return true
}

export const updateUserBlacklistStatus = async (
  user_id: string,
  is_blacklisted: boolean
): Promise<boolean> => {
  const prev_scope = 'sss' // get previous scope of user
  const new_scope = 'fff' // change value in scope for all societies to 'user'

  const { status } = await updateUserScopeInAuth(
    user_id,
    prev_scope,
    new_scope,
    is_blacklisted
  )
  if (status && status >= 200 && status < 300) {
    // if request above succeeds, then only update
    console.log('mark user as blacklisted or not', user_id, is_blacklisted)
    return true
  }

  return false
}

export const addSocietyToUserSocietyList = async (
  society_id: string,
  user_id: string,
  scope: string
): Promise<boolean> => {
  console.log('adding society to user society list', society_id, user_id, scope)
  console.log('update scope to give user the scope in society_id')
  return true
}

export const removeUserFromSociety = async (
  society_id: string,
  user_id: string
): Promise<boolean> => {
  // if user_id is not part of society_id already, then dont remove
  console.log('remove user from society', society_id, user_id)
  return true
}

export const updateUserScope = async (
  society_id: string,
  user_id: string,
  is_upgrade: boolean
): Promise<boolean> => {
  let scope = 'user'
  if (is_upgrade) {
    scope = 'admin'
  }

  const prev_scope = 'sss' // get previous scope of user
  const new_scope = 'fff' // change value in scope for society_id to scope

  const { status } = await updateUserScopeInAuth(
    user_id,
    prev_scope,
    new_scope,
    false
  )
  if (status && status >= 200 && status < 300) {
    // if request above succeeds, then only update
    console.log('set scope: ', society_id, user_id, scope)
    return true
  }

  return false
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
