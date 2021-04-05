export const updateUserScope = async (
  user_id: string,
  prevScope: string,
  newScope: string
): Promise<boolean> => {
  console.log(
    'update user scope in refresh token table: ',
    user_id,
    prevScope,
    newScope
  )
  // for all refresh tokens for the user id, change value of prevScope to newScope
  return true
}
