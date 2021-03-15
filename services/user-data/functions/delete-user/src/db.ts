export const deleteUser = async (user_id: string): Promise<boolean> => {
  // do not throw error if user is not present
  // if user present delete user
  console.log('deleting user..: ', user_id)
  return true
}
