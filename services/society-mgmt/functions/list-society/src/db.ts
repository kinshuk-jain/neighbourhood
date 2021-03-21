export const listSocietyNotApproved = async (
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.info('list societies approved===false ')
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

export const listSocietyPendingDeletion = async (
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.info('list societies pending_deletion: ')
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

export const listSocietyByType = async (
  type: string,
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.info('list societies of a type: ', type)
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

export const listSocietyInRegion = async (
  postal_code: string,
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  console.info('list societies in the postal code: ', postal_code)
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}

export const listSocietyByLocation = async (
  locationString: string,
  page_number: number,
  page_size: number
): Promise<Array<string>> => {
  // format location to get lattitude and longitude
  // location is of type "lat=123123;lon=123123"
  let location: { [key: string]: string } = {}
  locationString.split(';').map((coordString: string) => {
    const [key = '', value = ''] = coordString.split('=')
    if (key) {
      location[key.trim()] = value.trim()
    }
  })
  if (!location['lat'] || !location['lon']) {
    // throw error that location is invalid
  }

  console.info('list societies in the gps region: ', location)
  console.log(
    'retrieve results from: ',
    (page_number - 1) * page_size,
    ' to ',
    page_number * page_size - 1
  )
  return []
}
