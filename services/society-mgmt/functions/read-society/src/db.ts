export const getContacts = (society_id: string) => {
  // get only if society is not deleted
  console.info('get contacts: ', society_id)
}
export const getStatus = (society_id: string) => {
  // get only if society is not deleted
  console.info('get status: ', society_id)
}
export const getAddress = (society_id: string) => {
  // get only if society is not deleted
  console.info('get address: ', society_id)
}
export const getName = (society_id: string) => {
  // get only if society is not deleted
  console.info('get name: ', society_id)
}
export const getInvoice = (society_id: string) => {
  // get only if society is not deleted
  console.info('get invoice: ', society_id)
}
export const getAdmins = (society_id: string) => {
  // get only if society is not deleted
  console.info('get admins: ', society_id)
}
export const getVerificationStatus = (society_id: string) => {
  // get only if society is not deleted
  console.info('get verification status: ', society_id)
}
export const verifyAdmin = async (
  user_id: string,
  society_id: string
): Promise<boolean> => {
  // check if user_id is in part of society_id
  console.log(user_id, society_id)
  return true
}
