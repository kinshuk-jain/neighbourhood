export const deleteReply = async (
  post_id: string,
  reply_id: string,
  user_id: string,
  superUser: boolean
): Promise<boolean> => {
  if (superUser) {
    console.log('user is super user, simply delete the reply')
  }
  // delete reply only if reply was created by given user_id or if the user is super admin
  // do not forget to update num_comments in posts table
  // society id needed for it is already present in reply table
  console.log('deleting reply', reply_id, post_id, user_id)
  return true
}
