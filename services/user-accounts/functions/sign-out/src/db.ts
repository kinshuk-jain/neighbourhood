export const signoutUser = async (email: string): Promise<boolean> => {
  console.log('signing out user: ', email)
  // remove refresh token
  return true
}
