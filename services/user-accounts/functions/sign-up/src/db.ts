export const createNewUser = async ({
  first_name,
  last_name,
  address,
  phone,
  email,
}: {
  first_name: string
  last_name: string
  address: { [key: string]: any }
  phone: string
  email: string
}): Promise<boolean> => {
  console.log('signing up new user', {
    first_name,
    last_name,
    address: {
      ...address,
      country: 'IN',
    },
    phone,
    email,
    created_at: '213123',
    is_blacklisted: false,
    email_verified: false,
    user_agent: '', // user agent with which user logs in
    ip_address: '', // ip with which user logs in
    scope: 'user',
    billing_id: '12312',
    location: '',
    first_login: true,
  })
  return true
}

export const findUser = async (email: string): Promise<boolean> => {
  console.log('check if user already exists: ', email)
  return false
}
