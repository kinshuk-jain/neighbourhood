export const getUserData = async (
  email: string
): Promise<{
  email: string
  auth_code?: string[]
  scope: string
  is_blacklisted: boolean
  first_login: boolean
}> => {
  console.log('client data: ' + email)
  return {
    email,
    is_blacklisted: false,
    scope: 'admin',
    auth_code: await getAuthCodeForUser(email),
    first_login: true,
  }
}

const getAuthCodeForUser = async (email: string): Promise<string[]> => {
  console.log('return auth code for user: ', email)
  return ['auth-code']
}

export const saveAuthCode = async ({
  code,
  code_challenge,
  code_challenge_method,
  email,
}: {
  [key: string]: string
}): Promise<boolean> => {
  // create a secondary index mapping auth code to email
  const generated_at = Date.now()
  const expiry_time = Date.now() + 10 * 60 * 1000 // 10min
  console.log('save auth to db: ', {
    code,
    code_challenge,
    code_challenge_method,
    email,
    expiry_time, // exact time at which it will expire
    generated_at,
  })

  return true
}

export const removeAuthCode = async (email: string, code: string[]) => {
  // remove all codes in the code array
  console.log('remove this code: ' + email, code)
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
