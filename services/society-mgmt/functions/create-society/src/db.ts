export const addSocietyRecord = ({
  tutorial_finished,
  is_blacklisted,
  name,
  admins,
  user_id,
  address,
  imp_contacts,
}: {
  [key: string]: any
}) => {
  const tableName = 'society'
  console.log({
    tutorial_finished,
    is_blacklisted,
    name,
    admins,
    user_id,
    address,
    imp_contacts,
    directory: [],
  })
  // TODO: put this in DB if not exists
}
