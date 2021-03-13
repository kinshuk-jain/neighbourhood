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

export const saveDataInRefreshTokenTable = async ({
  token,
  email,
}: {
  token: string
  email: string
}): Promise<boolean> => {
  // create a secondary index mapping email to token
  const generated_at = Date.now()
  const expiry_time = Date.now() + 10 * 60 * 1000 // 10min
  console.log('saving data for refresh token: ', {
    token,
    email,
    expiry_time, // exact time at which it will expire
    generated_at,
    revoked: false,
    times_used: 1,
  })
  return true
}
