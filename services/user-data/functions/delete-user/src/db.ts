export const deleteUser = async (
  user_id: string,
  deletion_reason: string
): Promise<boolean> => {
  // do not throw error if user is not present
  // if user present delete user
  // save deletion_reason to db
  console.log('deleting user..: ', user_id, deletion_reason)
  return true
}

export const getUserData = async (
  user_id: string
): Promise<{
  email: string
  first_name: string
  last_name: string
}> => {
  console.log('getting user data: ', user_id)
  return {
    email: '231231',
    first_name: '1231',
    last_name: '1231',
  }
}
