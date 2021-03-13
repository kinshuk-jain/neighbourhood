// should receive the token and access level required
// will respond with whether allowed or not
export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false

  console.log('verifyaccess')
  console.log(event)
  return event
}

// TODO: allow user to update alias
