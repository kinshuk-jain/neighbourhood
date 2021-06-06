import axios from 'axios'
import { ENV, config } from '../config'
import { IAuthUserData } from '../interfaces'
import dbMapper from 'service-common/db/connect'
import { AuthCodeModel, AliasModel } from 'service-common/db/model'

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
    first_name: data.data.first_name,
    last_name: data.data.last_name,
  }
}

const getAuthCodeForUser = async (user_id: string): Promise<string[]> => {
  // get all auth codes for this user_id from auth codes table
  const result = ['']
  for await (const authCode of dbMapper.query(
    AuthCodeModel,
    {
      user_id,
    },
    { indexName: 'authentication-authorization-code-user-index' }
  )) {
    result.push(authCode.code)
  }
  return result
}

export const saveAuthCode = async ({
  code,
  code_challenge,
  code_challenge_method,
  user_id,
  for_blacklisted_user,
  scope,
}: {
  [key: string]: any
}): Promise<boolean> => {
  const model = new AuthCodeModel()

  Object.assign(model, {
    code,
    scope,
    code_challenge,
    code_challenge_method,
    user_id,
    expiry_time: Date.now() + 10 * 60 * 1000, // 10min
    generated_at: Date.now(), // exact time at which it will expire
    for_blacklisted_user,
  })

  return new Promise((res, rej) => {
    dbMapper
      .put({ item: model })
      .then(() => res(true))
      .catch((e) => rej(e))
  })
}

export const removeAuthCode = async (codeList: string[]): Promise<boolean> => {
  const promiseList = codeList.map((code) =>
    dbMapper.delete(
      Object.assign(new AuthCodeModel(), {
        code,
      })
    )
  )
  await Promise.all(promiseList)
  return true
}

export const getDataFromAlias = async (
  alias: string
): Promise<{
  user_id: string
  imei: string
  pub_key: string
}> => {
  const data = await dbMapper.get(Object.assign(new AliasModel(), { alias }))

  return {
    user_id: data.user_id,
    imei: data.imei,
    pub_key: data.pub_key,
  }
}

export const getUserDataFromAlias = async (
  alias: string
): Promise<IAuthUserData> => {
  const { user_id } = await getDataFromAlias(alias)
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
    first_name: data.data.first_name,
    last_name: data.data.last_name,
  }
}
