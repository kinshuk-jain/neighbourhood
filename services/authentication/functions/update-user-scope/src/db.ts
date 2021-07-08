import dbMapper from 'service-common/db/connect'
import { RefreshTokenModel } from 'service-common/db/model'

export const updateUserScope = async (
  user_id: string,
  newScope: string,
  blacklist: boolean
): Promise<boolean> => {
  for await (const refreshTokenIndexData of dbMapper.query(
    RefreshTokenModel,
    {
      user_id,
    },
    { indexName: 'authentication-refresh-token-user-index' }
  )) {
    const refreshTokenData = await dbMapper.get(
      Object.assign(new RefreshTokenModel(), {
        token: refreshTokenIndexData.token,
      })
    )

    refreshTokenData.scope = newScope
    refreshTokenData.for_blacklisted_user = blacklist

    await dbMapper.update(refreshTokenData)
  }
  return true
}
