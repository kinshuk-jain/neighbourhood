import axios from 'axios'
import { ENV, config } from './config'
import { IAuthUserData } from './interfaces'

export const getUserDataFromEmail = async (
  email: string
): Promise<IAuthUserData> => {
  const { status, data } = await axios.post(
    `${config[ENV].user_domain}/user/details`,
    {
      id_type: 'email',
      id_value: email,
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

  return {
    user_id: data.data.user_id,
    is_blacklisted: data.data.is_blacklisted,
    scope: data.data.scope,
    auth_code: await getAuthCodeForUser(data.data.user_id),
    first_login: data.data.first_login,
    email: data.data.email,
    first_name: '123123',
    last_name: 'dfwfsd',
  }
}

const getAuthCodeForUser = async (user_id: string): Promise<string[]> => {
  // get all auth codes for this user_id from auth codes table
  console.log('return auth code for user: ', user_id)
  return ['auth-code']
}

export const saveAuthCode = async ({
  code,
  code_challenge,
  code_challenge_method,
  user_id,
  for_blacklisted_user,
  scope,
}: {
  [key: string]: string | boolean
}): Promise<boolean> => {
  // create a secondary index mapping auth code to user_id
  const generated_at = Date.now()
  const expiry_time = Date.now() + 10 * 60 * 1000 // 10min
  console.log('save auth to db: ', {
    code,
    scope,
    code_challenge,
    code_challenge_method,
    user_id,
    expiry_time, // exact time at which it will expire
    generated_at,
    for_blacklisted_user,
  })

  return true
}

export const removeAuthCode = async (code: string[]) => {
  // remove all codes in the code array from auth code table
  console.log('remove this code: ', code)
  return true
}

const getUserIdFromAlias = async (alias: string): Promise<string> => {
  console.log(
    'get user_id from alias by retrieving it from alias table in authentication',
    alias
  )
  // if alias not found, return error
  return 'ssssssss'
}

export const getUserDataFromAlias = async (
  alias: string
): Promise<IAuthUserData> => {
  const user_id = await getUserIdFromAlias(alias)
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

  return {
    user_id: data.data.user_id,
    is_blacklisted: data.data.is_blacklisted,
    scope: data.data.scope,
    auth_code: await getAuthCodeForUser(data.data.user_id),
    first_login: data.data.first_login,
    email: data.data.email,
    first_name: '123123',
    last_name: 'dfwfsd',
  }
}
