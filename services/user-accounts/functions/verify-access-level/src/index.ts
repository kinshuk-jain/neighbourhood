// should receive the token and access level required
// will respond with whether allowed or not
export const handler = async (event: any) => {
  console.log('verifyaccess')
  console.log(event)
  return event
}
