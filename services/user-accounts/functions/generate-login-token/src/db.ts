export const getUserData = async (
  email: string
): Promise<{
  user_id: string
  auth_code?: string
}> => {
  console.log('client data: ' + email)
  return {
    user_id: email,
    auth_code: '123',
  }
}

export const saveAuthCode = async ({
  code,
  code_challenge,
  code_challenge_method,
  client_id,
  email,
}: {
  [key: string]: string
}): Promise<boolean> => {
  const generated_at = Date.now()
  const expiry_time = Date.now() + 10 * 60 * 1000 // 10min
  console.log('save auth to db: ', {
    code,
    code_challenge,
    code_challenge_method,
    client_id,
    email,
    expiry_time, // exact time at which it will expire
    generated_at,
  })

  return true
}

export const removeAuthCode = async (email: string, code: string) => {
  console.log('remove this code: ' + email, code)
  return true
}

export const updateUserData = async (
  email: string,
  key: string,
  value: string
) => {
  console.log('updating user data: ', email, key, value)
  return true
}

export const addAlias = async (alias: string, email: string) => {
  console.log('adding alias: ', alias, email)

  return true
}

export const getAliasData = async (
  alias: string
): Promise<{ alias: string; email: string }> => {
  console.log('getting alias data: ', alias)
  return {
    alias: '123',
    email: '123',
  }
}
