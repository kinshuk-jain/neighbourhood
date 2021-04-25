export const updateUserScope = async (
  user_id: string,
  prevScope: string,
  newScope: string,
  blacklist: boolean
): Promise<boolean> => {
  console.log(
    'update user scope in refresh token table: ',
    user_id,
    prevScope,
    newScope,
    blacklist
  )
  // for all refresh tokens for the user id, change value of prevScope to newScope
  // and blacklist status to blacklist
  return true
}
