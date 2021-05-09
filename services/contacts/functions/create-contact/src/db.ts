const getCountryCodeFromCountry = (country: string): string => {
  const countryCodes: Record<string, string> = {
    IN: '91',
  }
  return countryCodes[country]
}

const defaultCountry = 'IN'

export const createContact = async (
  society_id: string,
  { first_name, last_name, phone, address, category }: Record<string, any>
): Promise<{
  contact_id: string
  first_name: string
  last_name: string
  phone: string
  category: string
  address?: Record<string, any>
}> => {
  // society_id is partition key, contact_id is sort key
  // if for this society, contact_id does not exist, create one
  // contact_id is phone
  let contact_id = phone
  if (phone.startsWith('+')) {
    let phoneToken = phone.split(' ')
    if (!phoneToken.length) {
      phoneToken = phone.split('-')
    }
    if (!phoneToken.length) {
      throw new Error('Invalid phone')
    }

    if (phoneToken[1].startsWith('0')) {
      phoneToken[1] = phoneToken[1].slice(1)
    }
    contact_id = phoneToken.join('-').slice(1)
  } else {
    let country_code = getCountryCodeFromCountry(
      address ? address.country : defaultCountry
    )
    if (!country_code) {
      throw new Error('Phone country not supported')
    }
    if (contact_id.startsWith('0')) {
      contact_id = contact_id.slice(1)
    }
    contact_id = country_code + '-' + contact_id
  }

  console.log('creating contact for society', contact_id, society_id)

  return {
    contact_id,
    first_name,
    last_name,
    phone: '+' + contact_id,
    address,
    category,
  }
}
