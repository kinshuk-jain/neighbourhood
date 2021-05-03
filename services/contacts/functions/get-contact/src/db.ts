export const getContactData = async (
  society_id: string,
  contact_id: string
): Promise<Record<string, any>> => {
  console.log('get details for', society_id, contact_id)
  return {
    contact_id: '+211231231231',
    first_name: 'value',
    last_name: 'value',
    phone: '1231231231',
    address: {},
    category: 'vendor',
  }
}
