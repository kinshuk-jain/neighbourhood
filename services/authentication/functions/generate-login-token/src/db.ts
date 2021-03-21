export const getUserData = async (
  email: string
): Promise<{
  user_id: string
  auth_code?: string[]
  scope: string
  is_blacklisted: boolean
  first_login: boolean
}> => {
  // first get user id from email
  // then fetch data by user id
  const user_id = '1231231'
  console.log('client data: ' + email)
  return {
    user_id,
    is_blacklisted: false,
    scope: 'admin',
    auth_code: await getAuthCodeForUser(user_id),
    first_login: true,
  }
}

const getAuthCodeForUser = async (user_id: string): Promise<string[]> => {
  // need to have a table mapping email to user id
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

export const getAliasData = async (
  alias: string
): Promise<{ alias: string; user_id: string }> => {
  // need to have a table mapping alias to user id
  console.log('getting alias data: ', alias)
  return {
    alias: '123',
    user_id: '123',
  }
}
