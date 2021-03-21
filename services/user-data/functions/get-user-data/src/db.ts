export const getDetails = async (
  user_id: string
): Promise<{ [key: string]: any }> => {
  console.log('getting user details: ', {
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
    phone: '1231231231',
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    approved: false,
    is_blacklisted: false,
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
    phone: '1231231231',
    email: '123@example.com',
    first_login: true,
    society_list: [], // may be we want to include society names with society ids in this list to show on frontend
    approved: false,
    is_blacklisted: false,
    email_verified: false,
    profile_thumbnail: '',
  }
}
