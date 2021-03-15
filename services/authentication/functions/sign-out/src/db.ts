export const signoutUser = async (
  user_id: string,
  refresh_token: string
): Promise<boolean> => {
  console.log('signing out user: ', user_id, refresh_token)
  // remove refresh token
  return true
}
