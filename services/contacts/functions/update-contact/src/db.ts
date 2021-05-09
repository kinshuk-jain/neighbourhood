export const updateContactsInSociety = async (
  society_id: string,
  contact_id: number,
  contact_info: Record<string, any>
): Promise<Record<string, any>> => {
  // we do not allow changing phone for now as it's used as id
  const { first_name, last_name, category, address } = contact_info
  console.log('look for contact_id in society_id', contact_id, society_id)
  console.log('if found, update the information or else return error')
  return {
    first_name,
    last_name,
    category,
    address,
    phone: '+12-23423423423',
    contact_id,
  }
}
