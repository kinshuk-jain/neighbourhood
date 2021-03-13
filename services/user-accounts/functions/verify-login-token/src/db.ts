export const getAuthCodeData = async (
  code: string
): Promise<{
  code: string
  code_challenge: string
  code_challenge_method: string
  email: string
  scope: string
  expiry_time: number
}> => {
  // create a secondary index mapping email to code
  console.log('returning auth data')
  return {
    code,
    code_challenge: '123',
    code_challenge_method: 'sha256',
    email: '2222',
    scope: 'ddd',
    expiry_time: 12312312312,
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
  email: string
  expiry_time: number
  revoked: boolean
  times_used: number
  last_used_on: number
  ip_address: string
  user_agent: string
}> => {
  console.log('getting refresh token data: ' + token)
  return {
    token,
    email: '1231231',
    expiry_time: 1231231,
    revoked: false,
    times_used: 1,
    last_used_on: 0,
    ip_address: '121231',
    user_agent: '12312312',
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
  email,
  ip_address,
  user_agent,
}: {
  token: string
  email: string
  ip_address?: string
  user_agent?: string
}): Promise<boolean> => {
  // create a secondary index mapping email to token
  const generated_at = Date.now()
  const expiry_time = Date.now() + 31536000 * 1000 // 365 days
  console.log('saving data for refresh token: ', {
    token,
    email,
    expiry_time, // exact time at which token will expire
    generated_at,
    revoked: false,
    times_used: 1,
    last_used_on: 0,
    ip_address,
    user_agent,
  })
  return true
}

export const updateUserInfoOnLogin = async ({
  email,
  user_agent,
  ip_address,
}: {
  email: string
  ip_address: string
  user_agent: string
}): Promise<boolean> => {
  console.log('updating user info: ', {
    email,
    user_agent,
    ip_address,
    email_verified: true,
  })
  return true
}
