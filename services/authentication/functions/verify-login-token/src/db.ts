export const getAuthCodeData = async (
  code: string
): Promise<{
  code: string
  code_challenge: string
  code_challenge_method: string
  user_id: string
  scope: string
  expiry_time: number
  for_blacklisted_user: boolean
}> => {
  // create a secondary index mapping user_id to code
  console.log('returning auth data')
  return {
    code,
    code_challenge: '123',
    code_challenge_method: 'sha256',
    user_id: '2222',
    scope: 'ddd',
    expiry_time: 12312312312,
    for_blacklisted_user: false,
  }
}

export const removeAuthCode = async (code: string): Promise<boolean> => {
  console.log('removing auth code data: ', code)
  return true
}

export const getRefreshTokenData = async (
  token: string
): Promise<{
  token: string
  user_id: string
  expiry_time: number
  revoked: boolean
  times_used: number
  last_used_on: number
  ip_address: string
  user_agent: string
  scope: string
  for_blacklisted_user: boolean
}> => {
  console.log('getting refresh token data: ' + token)
  return {
    token,
    user_id: '1231231',
    expiry_time: 1231231,
    revoked: false,
    times_used: 1,
    last_used_on: 0,
    ip_address: '121231',
    user_agent: '12312312',
    scope: '1111',
    for_blacklisted_user: false,
  }
}

export const updateRefreshTokenDataOnAccessToken = async ({
  token,
  ip_address,
  user_agent,
  times_used,
  last_used_on,
}: {
  token: string
  ip_address?: string
  user_agent?: string
  times_used: number
  last_used_on: number
}): Promise<boolean> => {
  console.log(
    'updating refresh token table on access token issue with refresh token: ',
    {
      token,
      ip_address,
      user_agent,
      times_used,
      last_used_on,
    }
  )
  return true
}

export const deleteRefreshToken = async (token: string): Promise<boolean> => {
  console.log('deleting refresh token: ', token)
  return true
}

export const saveDataInRefreshTokenTable = async ({
  token,
  user_id,
  ip_address,
  user_agent,
  scope,
  for_blacklisted_user,
}: {
  token: string
  user_id: string
  ip_address?: string
  user_agent?: string
  scope: string
  for_blacklisted_user: boolean
}): Promise<boolean> => {
  // create a secondary index mapping user_id to token
  const generated_at = Date.now()
  const expiry_time = Date.now() + 31536000 * 1000 // 365 days
  console.log('saving data for refresh token: ', {
    token,
    user_id,
    expiry_time, // exact time at which token will expire
    generated_at,
    revoked: false,
    scope,
    times_used: 1,
    last_used_on: 0,
    ip_address,
    user_agent,
    for_blacklisted_user,
  })
  return true
}

const getUserBlacklistStatus = async (user_id: string): Promise<boolean> => {
  console.log('getting user data', user_id)
  return false // return user.is_blacklisted
}

export const updateUserInfoOnLogin = async ({
  user_id,
  user_agent,
  ip_address,
  refresh_token,
  for_blacklisted_user,
}: {
  user_id: string
  ip_address: string
  user_agent: string
  refresh_token: string
  for_blacklisted_user: boolean
}): Promise<boolean> => {
  // if user blacklist status changes at this point and refresh token is issued with
  // different blacklist privileges, update refresh token table to reflect this change
  const is_blacklisted = await getUserBlacklistStatus(user_id)
  if (is_blacklisted !== for_blacklisted_user) {
    // update refresh token table with is_blacklisted
  }

  console.log('updating user info: ', {
    user_id,
    user_agent,
    ip_address,
    email_verified: true,
    first_login: false,
    refresh_token,
  })
  return true
}
