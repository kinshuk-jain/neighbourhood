export const deletePost = async (
  society_id: string,
  post_id: string,
  user_id: string,
  superUser: boolean
): Promise<boolean> => {
  if (superUser) {
    console.log('user is super user, delete post')
  }
  // delete post only if user_id is same as user_id saved for post i.e. if this is the user who creatd it
  // or if the user is super admin
  console.log('deleting post', society_id, post_id, user_id)
  return true
}
