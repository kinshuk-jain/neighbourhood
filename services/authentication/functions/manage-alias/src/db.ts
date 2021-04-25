export const addUserAlias = async (
  alias: string,
  user_id: string,
  imei: string,
  pub_key: string
): Promise<boolean> => {
  // alias is user device_imei:date.now() encrypted with pvt key stored on user device
  // verify the alias is signed imei of user device (alias is base64 encoded)
  // const signed_imei = crypto.publicDecrypt(pub_key, Buffer.from(alias, 'base64'))
  // if (signed_imei.split(':')[0] !== imei) throw new Error('invalid operation')
  console.log(
    'adding alias for user in alias_table: ',
    alias,
    user_id,
    imei,
    pub_key
  )
  return true
}

export const removeUserAlias = async (alias: string): Promise<boolean> => {
  console.log('deleting alias', alias)
  return true
}

export const updateUserAlias = async (
  prevAlias: string,
  newAlias: string
): Promise<boolean> => {
  console.log(
    'add new value replacing prevAlias with newAlias',
    prevAlias,
    newAlias
  )
  return true
}
