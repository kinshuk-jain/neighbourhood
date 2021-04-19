export const getDetails = async (
  user_id: string
): Promise<{ [key: string]: any }> => {
  console.log('getting user details: ', {
    user_id,
    scope: '{ "society_id": "user" }',
    first_name: 'first name',
    last_name: 'last name',
    address: {
      city: 'mumbai',
      state: 'maharashtra',
      street_address: '212 dalal street',
      postal_code: '122245',
      country: 'IN',
    },
    phone: '1231231231',
    show_phone: true,
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    is_blacklisted: false,
    reported_count: [], // list of feeds of this user that were reported
    email_verified: false,
    profile_thumbnail: '',
  })

  return {
    user_id,
    first_name: 'first name',
    last_name: 'last name',
    address: {
      city: 'mumbai',
      state: 'maharashtra',
      street_address: '212 dalal street',
      postal_code: '122245',
      country: 'IN',
    },
    scope: '{ "society_id": "user" }',
    phone: '1231231231',
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    is_blacklisted: false,
    email_verified: false,
    profile_thumbnail: '',
  }
}

export const getDetailsByEmail = async (
  email: string
): Promise<{ [key: string]: any }> => {
  // first get user id from email
  console.log('getting user id from email', email)

  const user_id = '12312'

  console.log('getting user details by email: ', {
    user_id,
    scope: '{ "society_id": "user" }',
    first_name: 'first name',
    last_name: 'last name',
    address: {
      city: 'mumbai',
      state: 'maharashtra',
      street_address: '212 dalal street',
      postal_code: '122245',
      country: 'IN',
    },
    phone: '1231231231',
    show_phone: true,
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    is_blacklisted: false,
    reported_count: [], // list of feeds of this user that were reported
    email_verified: false,
    profile_thumbnail: '',
  })

  return {
    user_id,
    scope: '{ "society_id": "user" }',
    first_name: 'first name',
    last_name: 'last name',
    address: {
      city: 'mumbai',
      state: 'maharashtra',
      street_address: '212 dalal street',
      postal_code: '122245',
      country: 'IN',
    },
    phone: '1231231231',
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    is_blacklisted: false,
    email_verified: false,
    profile_thumbnail: '',
  }
}

export const getDetailsByAlias = async (
  alias: string
): Promise<{ [key: string]: any }> => {
  // first get user id from alias
  console.log('getting user id from alias', alias)
  const user_id = '12312'
  console.log('getting user details by alias: ', {
    user_id,
    scope: '{ "society_id": "user" }',
    first_name: 'first name',
    last_name: 'last name',
    address: {
      city: 'mumbai',
      state: 'maharashtra',
      street_address: '212 dalal street',
      postal_code: '122245',
      country: 'IN',
    },
    phone: '1231231231',
    show_phone: true,
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    is_blacklisted: false,
    reported_count: [], // list of feeds of this user that were reported
    email_verified: false,
    profile_thumbnail: '',
  })

  return {
    user_id,
    scope: '{ "society_id": "user" }',
    first_name: 'first name',
    last_name: 'last name',
    address: {
      city: 'mumbai',
      state: 'maharashtra',
      street_address: '212 dalal street',
      postal_code: '122245',
      country: 'IN',
    },
    phone: '1231231231',
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    is_blacklisted: false,
    email_verified: false,
    profile_thumbnail: '',
  }
}
