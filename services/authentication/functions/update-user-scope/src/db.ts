export const updateUserScope = async (
  user_id: string,
  scopeType: string,
  scopeValue: string
): Promise<boolean> => {
  console.log(
    'update user scope in refresh token table: ',
    user_id,
    scopeType,
    scopeValue
  )
  // for all refresh tokens for the user id, change value of scopeType to scopeValue
  return true
}
