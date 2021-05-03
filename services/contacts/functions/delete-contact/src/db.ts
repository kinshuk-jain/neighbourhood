export const deleteContact = async (
  society_id: string,
  contact_id: string
): Promise<boolean> => {
  // simply remove partition key(society_id), range key(contact_id) combination if it exists
  console.log('deleting contact for society', contact_id, society_id)

  return true
}
