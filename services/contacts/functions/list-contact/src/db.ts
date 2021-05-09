export const getContactsInSociety = async (
  society_id: string,
  page_number: number,
  page_size: number,
  category: string = ''
): Promise<Record<string, any>[]> => {
  if (category) {
    console.log(
      'get all contacts in society where category',
      society_id,
      category
    )
  } else {
    console.log('get all contacts in society', society_id)
  }

  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )

  return [
    {
      contact_id: '21-1231231231',
      first_name: 'value',
      last_name: 'value',
      phone: '+21-1231231231',
      address: {},
      category: 'vendor',
    },
    {
      contact_id: '21-1231231231',
      first_name: 'value',
      last_name: 'value',
      phone: '+21-1231231231',
      address: {},
      category: 'vendor',
    },
  ]
}

/**
 * return contacts whose address is available and falls within given postal code
 */
export const getContactsInRegion = async (
  postal_code: string,
  page_number: number,
  page_size: number,
  category: string
): Promise<Record<string, any>[]> => {
  console.log(
    'get contacts by postal code and filter by category',
    postal_code,
    category
  )

  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )

  return [
    {
      contact_id: '21-1231231231',
      first_name: 'value',
      last_name: 'value',
      phone: '+21-1231231231',
      address: {},
      category: 'vendor',
    },
    {
      contact_id: '21-1231231231',
      first_name: 'value',
      last_name: 'value',
      phone: '+21-1231231231',
      address: {},
      category: 'vendor',
    },
  ]
}
