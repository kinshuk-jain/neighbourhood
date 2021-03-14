export const signoutUser = async (
  email: string,
  refresh_token: string
): Promise<boolean> => {
  console.log('signing out user: ', email, refresh_token)
  // remove refresh token
  return true
}
