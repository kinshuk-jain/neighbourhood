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
  console.log('returning auth data')
  return {
    code,
    code_challenge: '123',
    code_challenge_method: 'S256',
    email: '2222',
    scope: 'ddd',
    expiry_time: 12312312312,
  }
}
