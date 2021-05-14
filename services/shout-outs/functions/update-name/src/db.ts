export const updateUserName = async (
  user_id: string,
  first_name: string,
  last_name: string
): Promise<boolean> => {
  console.log(
    'for every post by this user, update the first_name and last_name',
    user_id,
    first_name,
    last_name
  )
  return true
}
