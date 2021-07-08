import axios from 'axios'
import { config, ENV } from './config'
import dbMapper from 'service-common/db/connect'
import { RefreshTokenModel, AuthCodeModel } from 'service-common/db/model'

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
  const authCodeData = await dbMapper.get(
    Object.assign(new AuthCodeModel(), { code })
  )

  return {
    code: authCodeData.code,
    code_challenge: authCodeData.code_challenge,
    code_challenge_method: authCodeData.code_challenge_method,
    user_id: authCodeData.user_id,
    scope: authCodeData.scope,
    expiry_time: authCodeData.expiry_time,
    for_blacklisted_user: authCodeData.for_blacklisted_user,
  }
}

export const removeAuthCode = async (code: string): Promise<boolean> => {
  return new Promise((res, rej) =>
    dbMapper
      .delete(
        Object.assign(new AuthCodeModel(), {
          code,
        })
      )
      .then(() => res(true))
      .catch((e) => rej(e))
  )
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
  generated_at: number
  for_blacklisted_user: boolean
}> => {
  const refreshTokenData = await dbMapper.get(
    Object.assign(new RefreshTokenModel(), { token })
  )

  return {
    token: refreshTokenData.token,
    user_id: refreshTokenData.user_id,
    expiry_time: refreshTokenData.expiry_time,
    revoked: refreshTokenData.revoked,
    times_used: refreshTokenData.times_used,
    last_used_on: refreshTokenData.last_used_on,
    ip_address: refreshTokenData.ip_address,
    user_agent: refreshTokenData.user_agent,
    generated_at: refreshTokenData.generated_at,
    scope: refreshTokenData.scope,
    for_blacklisted_user: refreshTokenData.for_blacklisted_user,
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
  const refreshTokenData = await dbMapper.get(
    Object.assign(new RefreshTokenModel(), { token })
  )

  return new Promise((res, rej) =>
    dbMapper
      .update(
        Object.assign(refreshTokenData, {
          token,
          ip_address,
          user_agent,
          times_used,
          last_used_on,
        })
      )
      .then(() => res(true))
      .catch((e) => rej(e))
  )
}

export const deleteRefreshToken = async (token: string): Promise<boolean> => {
  return new Promise((res, rej) =>
    dbMapper
      .delete(Object.assign(new RefreshTokenModel(), { token }))
      .then(() => res(true))
      .catch((e) => rej(e))
  )
}

export const saveDataInRefreshTokenTable = async ({
  token,
  user_id,
  ip_address = '',
  user_agent = '',
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
  const refreshTokenData: RefreshTokenModel = Object.assign(
    new RefreshTokenModel(),
    {
      token,
      user_id,
      expiry_time: Date.now() + 31536000 * 1000, // exact time at which token will expire
      generated_at: Date.now(),
      revoked: false,
      scope,
      times_used: 1,
      last_used_on: 0,
      ip_address,
      user_agent,
      for_blacklisted_user,
    }
  )

  return new Promise((res, rej) =>
    dbMapper
      .put(refreshTokenData)
      .then(() => res(true))
      .catch((e) => rej(e))
  )
}

export const updateUserScope = async (
  refresh_token: string,
  user_id: string,
  scope: string,
  for_blacklisted_user: boolean
) => {
  // if scope changed between issue of auth code and issue of refresh token, we need to update
  // it in refresh token. It needs to happen after token has been issued as status can change
  // after we check and before refresh token is issued
  const { is_blacklisted, scope: storedScope } = await getUserInfo(user_id)
  if (is_blacklisted !== for_blacklisted_user || scope !== storedScope) {
    const refreshTokenData = await dbMapper.get(
      Object.assign(new RefreshTokenModel(), { token: refresh_token })
    )
    // update refresh token table with is_blacklisted and/or scope
    // if update fails delete refresh token and do not log user in
    // if deletion also fails simply throw and token will not be sent to the user
    return new Promise((res, rej) =>
      dbMapper
        .update(
          Object.assign(refreshTokenData, {
            scope: storedScope,
            for_blacklisted_user: is_blacklisted,
          })
        )
        .then(() => res(true))
        .catch((e) => {
          dbMapper.delete(refreshTokenData).then(() => rej(e))
        })
    )
  }

  return true
}

const getUserInfo = async (
  user_id: string
): Promise<{
  scope: string
  is_blacklisted: boolean
}> => {
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
