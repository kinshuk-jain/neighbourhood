import { publicDecrypt } from 'crypto'
import dbMapper from 'service-common/db/connect'
import { AliasModel } from 'service-common/db/model'

export const addUserAlias = async (
  alias: string,
  user_id: string,
  imei: string,
  pub_key: string
): Promise<boolean> => {
  // alias is user device_imei:user_id:date.now() encrypted with pvt key stored on user device
  // verify the alias is signed imei of user device (alias is base64 encoded)
  const signed_imei = publicDecrypt(
    pub_key,
    Buffer.from(alias, 'base64')
  ).toString()

  const { 0: decryptedImei, 1: decryptedUserId } = signed_imei.split(':')

  if (decryptedImei !== imei || decryptedUserId !== user_id) {
    throw new Error('invalid operation')
  }

  const aliasModel = new AliasModel()

  Object.assign(aliasModel, {
    alias,
    user_id,
    imei,
    pub_key,
  })

  return new Promise((res, rej) => {
    dbMapper
      .put({ item: aliasModel })
      .then(() => res(true))
      .catch((e) => rej(e))
  })
}

export const removeUserAlias = async (alias: string): Promise<boolean> =>
  new Promise((res, rej) => {
    dbMapper
      .delete(
        Object.assign(new AliasModel(), {
          alias,
        })
      )
      .then(() => res(true))
      .catch((e) => rej(e))
  })
