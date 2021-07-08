import dbMapper from 'service-common/db/connect'
import { RefreshTokenModel } from 'service-common/db/model'

export const signoutUser = async (
  user_id: string,
  refresh_token: string
): Promise<boolean> => {
  const { user_id: savedUserId } = await dbMapper.get(
    Object.assign(new RefreshTokenModel(), { token: refresh_token })
  )
  if (savedUserId === user_id) {
    return new Promise((res, rej) => {
      dbMapper
        .delete(
          Object.assign(new RefreshTokenModel(), { token: refresh_token })
        )
        .then(() => res(true))
        .catch((e) => rej(e))
    })
  }
  return Promise.reject(false)
}
