export const getRepliesForPost = async (
  post_id: string,
  pageNumber: number,
  pageSize: number
): Promise<Record<string, any>[]> => {
  // return replies
  console.log('returning replies for post', post_id, pageNumber, pageSize)
  return [{}]
}
