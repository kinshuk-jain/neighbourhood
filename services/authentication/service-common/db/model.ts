import {
  attribute,
  table,
  hashKey,
} from '@aws/dynamodb-data-mapper-annotations'

@table('authentication-authorization-code')
export class AuthCodeModel {
  @hashKey({ type: 'String' })
  code!: string

  @attribute()
  scope!: Record<string, any>

  @attribute()
  code_challenge!: string

  @attribute()
  code_challenge_method!: string

  @attribute()
  user_id!: string

  @attribute()
  expiry_time!: number

  @attribute()
  generated_at!: number

  @attribute()
  for_blacklisted_user!: boolean
}

@table('authentication-refresh-token')
export class RefreshTokenModel {
  @hashKey({ type: 'String' })
  token!: string

  @attribute()
  user_id!: String

  @attribute()
  user_agent!: String

  @attribute()
  ip_address!: String

  @attribute()
  scope!: String

  @attribute()
  expiry_time!: number

  @attribute()
  last_used_on!: number

  @attribute()
  generated_at!: number

  @attribute()
  revoked!: boolean

  @attribute()
  times_used!: number

  @attribute()
  for_blacklisted_user!: boolean
}

@table('authentication-user-alias')
export class AliasModel {
  @hashKey({ type: 'String' })
  alias!: string

  @attribute()
  user_id!: string

  @attribute()
  imei!: string

  @attribute()
  pub_key!: string
}
