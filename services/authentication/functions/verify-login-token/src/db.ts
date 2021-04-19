import axios from 'axios'
import { config, ENV } from './config'

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
    code_challenge:
      '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
    code_challenge_method: 'sha256',
    user_id: '123-232-3232',
    scope: 'user', // it is stringified scope object
    expiry_time: Date.now() + 1000,
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
    user_id: '123-232-3232',
    expiry_time: Date.now() + 1000,
    revoked: false,
    times_used: 1,
    last_used_on: 0,
    ip_address: '121231',
    user_agent: '12312312',
    scope: '1111', // it is stringified scope object
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

  // if scope changed between issue of auth code and issue of refresh token, we need to update
  // it in refresh token. It needs to happen after token has been issued as status can change
  // after we check and before refresh token is issued
  const { is_blacklisted, scope: storedScope } = await getUserInfo(user_id)
  if (is_blacklisted !== for_blacklisted_user || scope !== storedScope) {
    // update refresh token table with is_blacklisted and/or scope
    // if update fails delete refresh token and do not log user in
    // if deletion also fails simply throw and token will not be sent to the user
  }

  return true
}

const getUserInfo = async (
  user_id: string
): Promise<{
  scope: string
  is_blacklisted: boolean
}> => {
  // makre request to user_data service to get this data
  console.log('getting user data', user_id)
  let userData: { [key: string]: any } = {}
  if (process.env.ENVIRONMENT !== 'development') {
    const { status, data } = await axios.post(
      `${config[ENV].user_domain}/user/details`,
      {
        id_type: 'user_id',
        id_value: user_id,
      },
      {
        timeout: 10000, // 10s timeout
        auth: {
          username: 'authentication',
          password: process.env.USER_DATA_API_KEY || '',
        },
      }
    )

    if (status < 200 || status >= 300) {
      throw new Error('Internal service error. Could not fetch user data')
    }
    userData = data.data
  } else {
    userData = {
      is_blacklisted: false,
      scope: JSON.stringify({
        society_id: 'user',
      }), // stringified scope object
    }
  }

  return {
    is_blacklisted: userData.is_blacklisted,
    scope: userData.scope,
  }
}

export const updateUserInfoOnLogin = async ({
  user_id,
  user_agent,
  ip_address,
}: {
  user_id: string
  ip_address: string
  user_agent: string
}): Promise<boolean> => {
  console.log('updating user info: ', {
    user_id,
    user_agent,
    ip_address,
    email_verified: true,
    first_login: false,
  })

  if (process.env.ENVIRONMENT !== 'development') {
    const { status } = await axios.post(
      `${config[ENV].user_domain}/user/${user_id}/post-login`,
      {
        user_id,
        user_agent,
        ip_address,
        email_verified: true,
        first_login: false,
      },
      {
        timeout: 10000, // 10s timeout
        auth: {
          username: 'authentication',
          password: process.env.USER_DATA_API_KEY || '',
        },
      }
    )

    if (status < 200 || status >= 300) {
      throw new Error(
        'Internal service error. Could not update user data on login'
      )
    }
  }

  return true
}
